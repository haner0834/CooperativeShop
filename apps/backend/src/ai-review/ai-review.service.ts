import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import {
  AI_REVIEW_RESPONSE_SCHEMA,
  AI_REVIEW_SYSTEM_PROMPT,
  DEFAULT_GEMINI_API_BASE_URL,
  DEFAULT_GEMINI_MODEL,
} from './ai-review.constants';
import {
  buildPublicInfoPayload,
  buildShopInfoPayload,
} from './utils/ai-review.utils';
import { AiReviewResult } from './interfaces/ai-review-result.interface';
import { ShopDraftForReview } from './interfaces/shop-draft-for-review.interface';
import { InternalError } from 'src/types/error.types';
import { env } from 'src/common/utils/env.utils';

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly enableSearchGrounding: boolean;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = env('GEMINI_API_KEY');
    this.model = env('GEMINI_MODEL', DEFAULT_GEMINI_MODEL);
    this.baseUrl = env('GEMINI_API_BASE_URL', DEFAULT_GEMINI_API_BASE_URL);
    this.enableSearchGrounding =
      env('GEMINI_ENABLE_SEARCH_GROUNDING', 'true') === 'true';
  }

  /**
   * 對一筆 ShopDraft 資料做 AI 稽核。
   */
  async reviewDraft(draft: ShopDraftForReview): Promise<AiReviewResult> {
    const shopInfo = buildShopInfoPayload(draft);
    const publicInfo = buildPublicInfoPayload(draft);

    const contractBuffer: any = 0;

    const requestBody = this.buildRequestBody(shopInfo, contractBuffer);
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const responseData = await this.callGemini(url, requestBody);
    return this.parseResponse(responseData);
  }

  private buildRequestBody(
    shopInfo: unknown,
    contractBuffer?: Buffer,
  ): Record<string, unknown> {
    const parts: any[] = [
      {
        text: JSON.stringify({
          shop_info: shopInfo,
        }),
      },
    ];

    if (contractBuffer) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: contractBuffer.toString('base64'),
        },
      });
    }

    const body: Record<string, any> = {
      systemInstruction: {
        parts: [{ text: AI_REVIEW_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: AI_REVIEW_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    };

    if (this.enableSearchGrounding) {
      body.tools = [
        {
          googleSearch: {},
        },
      ];
    }

    return body;
  }

  private async callGemini(
    url: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { timeout: 60_000 }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(
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
      this.logger.log(
        `[Grounding] AI 成功檢索了 ${groundingMetadata.groundingChunks.length} 個真實網路資訊來源。`,
      );
    }

    if (!text) {
      this.logger.error(
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
        'isPassed',
        'suggestions',
      ];
      const hasAllFields = requiredFields.every((field) => field in parsed);

      if (!hasAllFields) {
        this.logger.error(
          'Gemini 回應遺漏了關鍵的 JSON 欄位（可能受聯網影響斷篇）',
          text,
        );
        throw new InternalError('AI 審核服務回應結構不完整');
      }

      return parsed as AiReviewResult;
    } catch (error) {
      this.logger.error('無法解析 AI 回應 JSON', text);
      throw new InternalError('AI 審核服務回應無法解析');
    }
  }
}
