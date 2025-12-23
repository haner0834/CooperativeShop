// rate-limit.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './rate-limit.service';

export type RateLimitOptions = RateLimitConfig;

export const RATE_LIMIT_KEY = 'rate_limit_options';
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
