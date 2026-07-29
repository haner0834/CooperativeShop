import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_TTL_SECONDS,
  IDEMPOTENCY_KEY_PREFIX,
} from '../idempotency.constants';
import { IdempotencyRecord } from '../interfaces/idempotency.interfaces';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

/**
 * Thin Redis wrapper. Contains no Nest-request-specific logic (spec
 * section 17) so it can be reused outside HTTP contexts if needed.
 */
@Injectable()
export class IdempotencyService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  buildKey(idempotencyKey: string, userId?: string): string {
    return userId
      ? `${IDEMPOTENCY_KEY_PREFIX}:${userId}:${idempotencyKey}`
      : `${IDEMPOTENCY_KEY_PREFIX}:${idempotencyKey}`;
  }

  async find(redisKey: string): Promise<IdempotencyRecord | null> {
    const raw = await this.redis.get(redisKey);
    if (!raw) return null;
    return JSON.parse(raw) as IdempotencyRecord;
  }

  /**
   * Atomically creates the "processing" lock. Returns false if a record
   * (processing or completed) already exists for this key — the caller
   * must then call find() to decide between Case B/C/D.
   */
  async tryAcquire(
    redisKey: string,
    requestHash: string,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<boolean> {
    const record: IdempotencyRecord = {
      status: 'processing',
      requestHash,
      createdAt: Date.now(),
    };

    const result = await this.redis.set(
      redisKey,
      JSON.stringify(record),
      'EX',
      ttl,
      'NX',
    );

    return result === 'OK';
  }

  /** Persists the successful response, replacing the "processing" lock. */
  async complete(
    redisKey: string,
    requestHash: string,
    statusCode: number,
    response: unknown,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    const record: IdempotencyRecord = {
      status: 'completed',
      requestHash,
      statusCode,
      response,
      createdAt: Date.now(),
    };

    await this.redis.set(redisKey, JSON.stringify(record), 'EX', ttl);
  }

  /** Used when replayErrors=true: caches the error response for replay. */
  async saveError(
    redisKey: string,
    requestHash: string,
    statusCode: number,
    response: unknown,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    await this.complete(redisKey, requestHash, statusCode, response, ttl);
  }

  /** Releases the lock on failure when replayErrors=false. */
  async delete(redisKey: string): Promise<void> {
    await this.redis.del(redisKey);
  }
}
