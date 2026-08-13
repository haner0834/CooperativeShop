import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiReviewService } from './ai-review.service';

@Module({
  imports: [HttpModule.register({ timeout: 30_000 })],
  providers: [AiReviewService],
  exports: [AiReviewService],
})
export class AiReviewModule {}
