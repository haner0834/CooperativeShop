import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { prompts } from 'src/generated/prompts';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AI_REVIEW_RESPONSE_FORMAT,
  DEFAULT_GEMINI_API_BASE_URL,
  DEFAULT_GEMINI_FREE_MODEL,
  DEFAULT_GEMINI_MODEL,
} from './ai-review.constants';
import {
  buildPublicInfoPayload,
  buildShopInfoPayload,
  extractGroundingSources,
  extractModelOutputText,
  extractWebSearchQueries,
} from './utils/ai-review.utils';
import { AiReviewResult } from './interfaces/ai-review-result.interface';
import { AiReviewGroundingSnapshot } from './interfaces/ai-review-grounding-source.interface';
import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import { BadRequestError, InternalError } from 'src/types/error.types';
import { env } from 'src/common/utils/env.utils';
import { getImageUrl } from 'src/common/utils/get-image-url.utils';
import { promises as fs } from 'fs';

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  // Step 1（grounding-only）用：需要開 googleSearch，走有掛正式帳單的專案。
  private readonly apiKey: string;
  private readonly model: string;

  // Step 2（正式審核，只要 JSON，不搜尋）用：不再需要 googleSearch 權限，
  // 所以「每一次」審核都可以走免費專案，不只是第二次以後。
  private readonly freeApiKey: string;
  private readonly freeProjectNumber: string;
  private readonly freeModel: string;

  private readonly baseUrl: string;
  private readonly enableSearchGrounding: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = env('GEMINI_API_KEY');
    this.model = env('GEMINI_MODEL', DEFAULT_GEMINI_MODEL);

    this.freeApiKey = env('GEMINI_FREE_API_KEY');
    this.freeProjectNumber = env('GEMINI_FREE_PROJ_NUMBER');
    this.freeModel = env('GEMINI_FREE_MODEL', DEFAULT_GEMINI_FREE_MODEL);

    this.baseUrl = env('GEMINI_API_BASE_URL', DEFAULT_GEMINI_API_BASE_URL);
    this.enableSearchGrounding =
      env('GEMINI_ENABLE_SEARCH_GROUNDING', 'true') === 'true';
  }

  /**
   * 對一筆 ShopDraft 資料做 AI 稽核。
   *
   * 拆成兩次獨立的 Gemini 呼叫，刻意不在同一次請求裡同時開
   * `google_search` tool 跟 `response_format`：
   *
   * - Step 1（僅限這個 draft 從沒 grounding 過時才呼叫）：
   *   純搜尋，不帶 schema，換取穩定的 annotations/citation，
   *   查完存進 ShopDraft.aiGroundingSources。
   * - Step 2（每次都呼叫）：不掛 google_search，只要求結構化 JSON，
   *   吃 shop_info + 合約 PDF + （若有）Step 1 存好的 public_info，
   *   產出真正的審核結果。
   *
   * 審核結果一律寫回 draft.currentVersion.aiReviewResult。
   */
  async reviewDraft(draft: ShopDraftDto): Promise<AiReviewResult> {
    this.assertReviewable(draft);

    const shopInfo = buildShopInfoPayload(draft);

    let groundingSnapshot = await this.getGroundingSnapshot(draft.id);
    if (!groundingSnapshot && this.enableSearchGrounding) {
      groundingSnapshot = await this.runGroundingStep(shopInfo);
      if (groundingSnapshot) {
        await this.saveGroundingSnapshot(draft.id, groundingSnapshot);
      }
    }

    const hasRealGrounding = !!groundingSnapshot?.sources?.length;
    const publicInfo = buildPublicInfoPayload(groundingSnapshot);

    const contractBuffer = await this.downloadFileAsBuffer(
      getImageUrl(draft.contract!.fileKey!),
    );

    const result = await this.runReviewStep(
      shopInfo,
      publicInfo,
      contractBuffer,
      hasRealGrounding,
    );

    await this.saveReviewResult(draft.currentVersion!.id, result);

    return result;
  }

  private assertReviewable(draft: ShopDraftDto): void {
    if (!draft.contract?.fileKey) {
      throw new BadRequestError(
        'MISSING_CONTRACT_FILE_URL',
        '尚未上傳合約掃描檔，無法進行 AI 審核',
      );
    }
    if (!draft.currentVersion?.id) {
      throw new BadRequestError(
        'MISSING_CURRENT_VERSION',
        '此草稿沒有待審核的版本',
      );
    }
  }

  private async getGroundingSnapshot(
    draftId: string,
  ): Promise<AiReviewGroundingSnapshot | null> {
    const draft = await this.prisma.shopDraft.findUniqueOrThrow({
      where: { id: draftId },
      select: { aiGroundingSources: true },
    });

    const snapshot =
      draft.aiGroundingSources as unknown as AiReviewGroundingSnapshot | null;

    if (!snapshot?.sources?.length) return null;
    return snapshot;
  }

  /**
   * Step 1：grounding-only 呼叫。
   *
   * 刻意不帶 `response_format`——一旦跟 `google_search` 同時出現，
   * Interactions API 的 annotations（新版）／generateContent 的
   * groundingMetadata（舊版）很容易整包回空的，這是 Gemini 目前有
   * 已知回報的行為，不是我們呼叫方式錯。這次呼叫也不需要附合約 PDF，
   * 跟合約審核無關，可以省下這次的 PDF token。
   *
   * 這裡沒有一定會拿到來源：可能是這次真的沒查到公開資訊，也可能是
   * Gemini 端 grounding metadata 本身偶爾異常（跟有沒有開 schema 無關）。
   * 兩種情況都直接回 null、不存 snapshot，讓下一次審核重新嘗試 grounding，
   * 而不是把「沒查到」跟「查到但空」混為一談、卡死在錯誤狀態。
   */
  private async runGroundingStep(
    shopInfo: unknown,
  ): Promise<AiReviewGroundingSnapshot | null> {
    console.log('grounding step triggered');
    const url = `${this.baseUrl}/interactions`;

    const body: Record<string, unknown> = {
      model: this.model,
      system_instruction: prompts.AI_SHOP_GROUNDING_PROMPT,
      input: [
        {
          type: 'text',
          text: JSON.stringify({ shop_info: shopInfo }),
        },
      ],
      tools: [{ type: 'google_search' }],
      generation_config: {
        temperature: 0.2,
      },
      store: false,
    };

    const responseData = await this.callGemini(url, body, {
      'x-goog-api-key': this.apiKey,
    });

    await fs.writeFile(
      `./results/groundings/${new Date().toISOString()}.json`,
      JSON.stringify(responseData, null, 2),
      'utf-8',
    );

    const sources = extractGroundingSources(responseData);

    if (!sources.length) {
      this.logger.warn(
        'Grounding 呼叫沒有拿到任何 annotation/citation（可能是這次沒查到公開資訊，' +
          '也可能是 Gemini grounding metadata 異常），本次不存 snapshot，下次審核會重新嘗試。',
      );
      return null;
    }

    const findings = extractModelOutputText(responseData);

    if (!findings) {
      this.logger.warn(
        '有拿到 annotation/citation 但抓不到 model_output 文字，snapshot 缺少 findings，' +
          '本次不存 snapshot，下次審核會重新嘗試。',
      );
      return null;
    }

    return {
      fetchedAt: new Date().toISOString(),
      webSearchQueries: extractWebSearchQueries(responseData),
      findings,
      sources,
    };
  }

  private async saveGroundingSnapshot(
    draftId: string,
    snapshot: AiReviewGroundingSnapshot,
  ): Promise<void> {
    await this.prisma.shopDraft.update({
      where: { id: draftId },
      data: {
        aiGroundingSources: snapshot as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async saveReviewResult(
    versionId: string,
    result: AiReviewResult,
  ): Promise<void> {
    await this.prisma.shopDraftVersion.update({
      where: { id: versionId },
      data: {
        aiReviewResult: result as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Step 2：正式審核呼叫。不掛 `google_search`，只要求結構化 JSON。
   * 因為不搜尋，一律可以走免費專案（不再只有「第二次以後」才走免費）。
   */
  private async runReviewStep(
    shopInfo: unknown,
    publicInfo: unknown,
    contractBuffer: Buffer,
    hasRealGrounding: boolean,
  ): Promise<AiReviewResult> {
    console.log('Review step triggered');
    const url = `${this.baseUrl}/interactions`;

    const input: any[] = [
      {
        type: 'text',
        text: JSON.stringify({
          shop_info: shopInfo,
          public_info: publicInfo,
        }),
      },
      {
        type: 'document',
        mime_type: 'application/pdf',
        data: contractBuffer.toString('base64'),
      },
    ];

    const body: Record<string, unknown> = {
      model: this.freeModel,
      system_instruction: prompts.AI_SHOP_REVIEW_PROMPT,
      input,
      response_format: AI_REVIEW_RESPONSE_FORMAT,
      generation_config: {
        temperature: 0.2,
      },
      store: false,
    };

    const responseData = await this.callGemini(url, body, {
      'x-goog-api-key': this.freeApiKey,
      'x-goog-user-project': this.freeProjectNumber,
    });

    await fs.writeFile(
      `./results/reviews/${new Date().toISOString()}.json`,
      JSON.stringify(responseData, null, 2),
      'utf-8',
    );

    const result = this.parseResponse(responseData);
    return this.sanitizeUnverifiedSources(result, hasRealGrounding);
  }

  private async downloadFileAsBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(fileUrl, {
          responseType: 'arraybuffer',
          timeout: 30_000,
        }),
      );

      // 將 ArrayBuffer 轉為 Node.js Buffer
      return Buffer.from(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`從 R2 下載合約檔案失敗 (${fileUrl})`, axiosError.message);
      throw new InternalError('無法取得店鋪合約檔案');
    }
  }

  private async callGemini(
    url: string,
    body: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { timeout: 600_000, headers }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        'Gemini API 呼叫失敗',
        axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message,
      );
      throw new InternalError('AI 審核服務暫時無法使用，請稍後再試');
    }
  }

  /**
   * `hasRealGrounding` 現在直接由 Step 1 是否存到 snapshot 決定，
   * 不再從 Step 2 的 responseData 反推——Step 2 本來就不掛
   * google_search，responseData 裡不會有任何 grounding 資訊可看。
   */
  private sanitizeUnverifiedSources(
    result: AiReviewResult,
    hasRealGrounding: boolean,
  ): AiReviewResult {
    if (hasRealGrounding) return result;

    const publicSourceLabels = [
      'Google Maps',
      '官方網站',
      '官方社群',
      '其他公開資訊',
    ];

    for (const key of Object.keys(result)) {
      const field = (result as any)[key];
      if (
        field &&
        typeof field === 'object' &&
        'source' in field &&
        publicSourceLabels.some((label) => field.source?.includes(label))
      ) {
        field.source = '無法查證';
        field.isValid = false;
        field.reason = `${field.reason}(系統偵測：本次未取得即時公開資訊佐證，已自動修正來源標註)`;
      }
    }

    return result;
  }

  private parseResponse(data: any): AiReviewResult {
    const text = extractModelOutputText(data);

    if (!text) {
      console.error(
        '互動回應格式不符預期（找不到 model_output step 裡的 text content）',
        JSON.stringify(data),
      );
      throw new InternalError('AI 審核服務回應格式異常');
    }

    try {
      const parsed = JSON.parse(text);

      const requiredFields = [
        'title',
        'subtitle',
        'discount',
        'contract',
        'isPassed',
        'suggestions',
      ];
      const hasAllFields = requiredFields.every((field) => field in parsed);

      if (!hasAllFields) {
        console.error('Gemini 回應遺漏了關鍵的 JSON 欄位', text);
        throw new InternalError('AI 審核服務回應結構不完整');
      }

      return parsed as AiReviewResult;
    } catch (error) {
      console.error('無法解析 AI 回應 JSON', text);
      throw new InternalError('AI 審核服務回應無法解析');
    }
  }
}
