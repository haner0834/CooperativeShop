import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { prompts } from 'src/generated/prompts';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AI_REVIEW_RESPONSE_SCHEMA,
  DEFAULT_GEMINI_API_BASE_URL,
  DEFAULT_GEMINI_FREE_MODEL,
  DEFAULT_GEMINI_MODEL,
} from './ai-review.constants';
import {
  buildPublicInfoPayload,
  buildShopInfoPayload,
  extractGroundingSources,
  extractWebSearchQueries,
} from './utils/ai-review.utils';
import { AiReviewResult } from './interfaces/ai-review-result.interface';
import { AiReviewGroundingSnapshot } from './interfaces/ai-review-grounding-source.interface';
import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import { BadRequestError, InternalError } from 'src/types/error.types';
import { env } from 'src/common/utils/env.utils';
import { getImageUrl } from 'src/common/utils/get-image-url.utils';

interface RequestTarget {
  url: string;
  headers?: Record<string, string>;
}

@Injectable()
export class AiReviewService {
  // 第一次審核用：有開 googleSearch grounding 的正式專案，比較貴。
  private readonly apiKey: string;
  private readonly model: string;

  // 第二次以後用：免費層級專案，不掛 googleSearch，靠上次存好的
  // grounding 來源當作 public_info context。
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
   * - 這個 draft 從沒被 grounding 過 -> 用正式專案 + googleSearch，
   *   查完把來源存進 ShopDraft.aiGroundingSources。
   * - 已經有存過的 grounding 來源 -> 用免費專案，不開 googleSearch，
   *   直接把存好的來源餵給模型，省下 grounding 費用。
   *
   * 審核結果一律寫回 draft.currentVersion.aiReviewResult。
   */
  async reviewDraft(draft: ShopDraftDto): Promise<AiReviewResult> {
    this.assertReviewable(draft);

    const shopInfo = buildShopInfoPayload(draft);
    const groundingSnapshot = await this.getGroundingSnapshot(draft.id);
    const useGrounding = !groundingSnapshot && this.enableSearchGrounding;
    const publicInfo = buildPublicInfoPayload(groundingSnapshot?.sources ?? []);

    const contractBuffer = await this.downloadFileAsBuffer(
      getImageUrl(draft.contract!.fileKey!),
    );

    const requestBody = this.buildRequestBody(
      shopInfo,
      publicInfo,
      contractBuffer,
      useGrounding,
    );
    const { url, headers } = this.resolveRequestTarget(useGrounding);

    const responseData = await this.callGemini(url, requestBody, headers);
    const result = this.parseResponse(responseData);

    if (useGrounding) {
      await this.saveGroundingSnapshot(draft.id, responseData);
    }

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

  private async saveGroundingSnapshot(
    draftId: string,
    responseData: unknown,
  ): Promise<void> {
    const sources = extractGroundingSources(responseData);

    // 這次 googleSearch 沒查到任何東西的話別存空快照，
    // 讓下一次審核還是會再嘗試 grounding，而不是永遠停在「沒有公開資訊」。
    if (!sources.length) return;

    const snapshot: AiReviewGroundingSnapshot = {
      fetchedAt: new Date().toISOString(),
      webSearchQueries: extractWebSearchQueries(responseData),
      sources,
    };

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

  private resolveRequestTarget(useGrounding: boolean): RequestTarget {
    if (useGrounding) {
      return {
        url: `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      };
    }

    return {
      url: `${this.baseUrl}/models/${this.freeModel}:generateContent?key=${this.freeApiKey}`,
      // 免費專案用這個 header 把用量掛到指定的 project number 上。
      headers: { 'x-goog-user-project': this.freeProjectNumber },
    };
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

  private buildRequestBody(
    shopInfo: unknown,
    publicInfo: unknown,
    contractBuffer: Buffer,
    useGrounding: boolean,
  ): Record<string, unknown> {
    const parts: any[] = [
      {
        text: JSON.stringify({
          shop_info: shopInfo,
          public_info: publicInfo,
        }),
      },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: contractBuffer.toString('base64'),
        },
      },
    ];

    const body: Record<string, any> = {
      systemInstruction: {
        parts: [{ text: prompts.AI_SHOP_REVIEW_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: AI_REVIEW_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    };

    // 只有第一次（真的要用 googleSearch）才掛 tools，
    // 免費專案那次刻意不掛，靠 public_info 裡存好的來源清單頂替。
    if (useGrounding) {
      body.tools = [{ googleSearch: {} }];
    }

    return body;
  }

  private async callGemini(
    url: string,
    body: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { timeout: 60_000, headers }),
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

  private parseResponse(data: any): AiReviewResult {
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    const groundingMetadata = data?.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      console.log(
        `[Grounding] AI 成功檢索了 ${groundingMetadata.groundingChunks.length} 個真實網路資訊來源。`,
      );
    }

    if (!text) {
      console.error(
        'Gemini 回應格式不符預期（找不到 candidates[0].content.parts[0].text）',
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
        console.error(
          'Gemini 回應遺漏了關鍵的 JSON 欄位（可能受聯網影響斷篇）',
          text,
        );
        throw new InternalError('AI 審核服務回應結構不完整');
      }

      return parsed as AiReviewResult;
    } catch (error) {
      console.error('無法解析 AI 回應 JSON', text);
      throw new InternalError('AI 審核服務回應無法解析');
    }
  }
}
