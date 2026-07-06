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
  buildContractPayload,
  buildPublicInfoPayload,
  buildShopInfoPayload,
} from './utils/ai-review.utils';
import { AiReviewResult } from './interfaces/ai-review-result.interface';
import { ShopDraftForReview } from './interfaces/shop-draft-for-review.interface';
import { InternalError } from 'src/types/error.types';

@Injectable()
export class AiReviewService {
  private readonly logger = new Logger(AiReviewService.name);

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.model =
      this.configService.get<string>('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL;
    this.baseUrl =
      this.configService.get<string>('GEMINI_API_BASE_URL') ??
      DEFAULT_GEMINI_API_BASE_URL;
  }

  /**
   * 對一筆 ShopDraft 資料做 AI 稽核。
   */
  async reviewDraft(draft: ShopDraftForReview): Promise<AiReviewResult> {
    const shopInfo = buildShopInfoPayload(draft);
    const contract = buildContractPayload(draft);
    const publicInfo = buildPublicInfoPayload(draft);

    const requestBody = this.buildRequestBody(shopInfo, contract, publicInfo);
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const responseData = await this.callGemini(url, requestBody);
    return this.parseResponse(responseData);
  }

  private buildRequestBody(
    shopInfo: unknown,
    contract: unknown,
    publicInfo: unknown,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      systemInstruction: {
        parts: [{ text: AI_REVIEW_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify({
                shop_info: shopInfo,
                contract,
                public_info: publicInfo,
              }),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: AI_REVIEW_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    };

    return body;
  }

  private async callGemini(
    url: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { timeout: 30_000 }),
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

    if (!text) {
      this.logger.error(
        'Gemini 回應格式不符預期（找不到 candidates[0].content.parts[0].text）',
        JSON.stringify(data),
      );
      throw new InternalError('AI 審核服務回應格式異常');
    }

    try {
      return JSON.parse(text) as AiReviewResult;
    } catch (error) {
      this.logger.error('無法解析 AI 回應 JSON', text);
      throw new InternalError('AI 審核服務回應無法解析');
    }
  }
}
