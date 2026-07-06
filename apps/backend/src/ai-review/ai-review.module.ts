import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiReviewService } from './ai-review.service';

/**
 * 這個模組刻意不提供 Controller —— 只透過 AiReviewService 給系統內其他模組使用
 * （例如審核流程模組在 approve/reject 之前先呼叫這裡做預檢查）。
 *
 * NOTE: 需要在 .env 補上：
 *   GEMINI_API_KEY=xxx                          必填
 *   GEMINI_MODEL=gemini-2.5-flash                選填，預設見 ai-review.constants.ts
 *   GEMINI_API_BASE_URL=https://...              選填
 *   GEMINI_ENABLE_SEARCH_GROUNDING=true|false     選填，預設 false
 */
@Module({
  imports: [HttpModule.register({ timeout: 30_000 }), ConfigModule],
  providers: [AiReviewService],
  exports: [AiReviewService],
})
export class AiReviewModule {}
