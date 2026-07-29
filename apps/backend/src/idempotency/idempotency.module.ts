import { Module } from '@nestjs/common';
import { IdempotencyService } from './services/idempotency.service';
import { RequestHashService } from './services/request-hash.service';

@Module({
  providers: [IdempotencyService, RequestHashService],
  exports: [IdempotencyService, RequestHashService],
})
export class IdempotencyModule {}
