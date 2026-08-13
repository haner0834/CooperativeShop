import { SetMetadata } from '@nestjs/common';
import { IDEMPOTENT_KEY } from './idempotency.constants';
import { IdempotentOptions } from './interfaces/idempotency.interfaces';

/**
 * Marks a route handler as idempotent. Only handlers annotated with this
 * decorator are affected by IdempotencyGuard / IdempotencyInterceptor.
 *
 * @example
 * ```ts
 * @Idempotent({ ttl: 3600, replayErrors: false })
 * @Post('orders')
 * createOrder(@Body() dto: CreateOrderDto) { ... }
 * ```
 */
export const Idempotent = (options: IdempotentOptions = {}) =>
  SetMetadata(IDEMPOTENT_KEY, options);
