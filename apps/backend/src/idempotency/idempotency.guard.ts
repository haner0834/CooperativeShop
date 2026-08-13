import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  DEFAULT_TTL_SECONDS,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_KEY,
} from './idempotency.constants';
import {
  IdempotencyContext,
  IdempotentOptions,
} from './interfaces/idempotency.interfaces';
import {
  IdempotencyKeyReusedException,
  IdempotencyProcessingException,
} from './idempotency.exceptions';
import { IdempotencyService } from './services/idempotency.service';
import { RequestHashService } from './services/request-hash.service';
import { UserPayload } from 'src/auth/types/auth.types';

/**
 * Implements spec sections 11-13.
 *
 * Responsible for: reading metadata/header, computing the request hash,
 * acquiring the Redis lock, and deciding replay vs. conflict.
 * Deliberately does NOT touch the response — that's the Interceptor's job.
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
    private readonly requestHashService: RequestHashService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<IdempotentOptions | undefined>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    // Not @Idempotent() -> pass through untouched.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const idempotencyKey = request.header(IDEMPOTENCY_KEY_HEADER);

    // Missing header: policy choice per spec section 12. We let the
    // request proceed as a normal (non-idempotent) call rather than
    // rejecting it outright. Flip this to `throw new BadRequestException()`
    // if your API requires the header on all @Idempotent() routes.
    if (!idempotencyKey) {
      return true;
    }

    const ttl = options?.ttl ?? DEFAULT_TTL_SECONDS;
    const requestHash = this.computeHash(request, options?.headerWhitelist);
    const userId = this.extractUserId(request);
    const redisKey = this.idempotencyService.buildKey(idempotencyKey, userId);

    // Case A: attempt atomic lock acquisition first (SET NX). This avoids
    // a lookup-then-set race between two concurrent identical requests.
    const acquired = await this.idempotencyService.tryAcquire(
      redisKey,
      requestHash,
      ttl,
    );

    if (acquired) {
      this.attachContext(request, {
        replay: false,
        key: redisKey,
        requestHash,
        ttl,
      });
      return true;
    }

    // Lock already existed -> inspect it for Case B / C / D.
    const existing = await this.idempotencyService.find(redisKey);

    // Extremely unlikely (TTL expired between the failed SET and this GET).
    // Treat as a fresh request by retrying acquisition once.
    if (!existing) {
      const retryAcquired = await this.idempotencyService.tryAcquire(
        redisKey,
        requestHash,
        ttl,
      );
      if (retryAcquired) {
        this.attachContext(request, {
          replay: false,
          key: redisKey,
          requestHash,
          ttl,
        });
        return true;
      }
      throw new IdempotencyProcessingException();
    }

    if (existing.status === 'processing') {
      // Case B
      throw new IdempotencyProcessingException();
    }

    // existing.status === 'completed'
    if (existing.requestHash !== requestHash) {
      // Case D
      throw new IdempotencyKeyReusedException();
    }

    // Case C
    this.attachContext(request, {
      replay: true,
      key: redisKey,
      requestHash,
      ttl,
      record: existing,
    });
    return true;
  }

  private computeHash(
    request: Request,
    headerWhitelist: string[] | undefined,
  ): string {
    const whitelist = headerWhitelist ?? [];
    const extraHeaders = whitelist.reduce<Record<string, string>>(
      (acc, headerName) => {
        const value = request.header(headerName);
        if (value !== undefined) {
          acc[headerName.toLowerCase()] = value;
        }
        return acc;
      },
      {},
    );

    return this.requestHashService.hash(
      request.method,
      request.originalUrl ?? request.url,
      request.body,
      extraHeaders,
    );
  }

  /** Anonymous requests fall back to the global `idem:v1:{key}` namespace. */
  private extractUserId(request: Request): string | undefined {
    const user = (request as Request & { user?: UserPayload }).user;
    return user?.id;
  }

  private attachContext(request: Request, context: IdempotencyContext): void {
    request.idempotency = context;
  }
}
