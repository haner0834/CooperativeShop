import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IDEMPOTENT_KEY } from './idempotency.constants';
import { IdempotentOptions } from './interfaces/idempotency.interfaces';
import { IdempotencyService } from './services/idempotency.service';

/**
 * Implements spec sections 14-16.
 *
 * IMPORTANT ordering requirement: this interceptor must run BEFORE any
 * global "wrap the response" interceptor (e.g. ResponseSuccessInterceptor),
 * so that what gets cached in Redis is the raw controller DTO, not the
 * wrapped envelope (spec section 16). In Nest, interceptors registered
 * earlier run outer-most, so register this one first:
 *
 *   app.useGlobalInterceptors(
 *     new IdempotencyInterceptor(...),
 *     new ResponseSuccessInterceptor(...),
 *   );
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<IdempotentOptions | undefined>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const idempotency = request.idempotency;

    // Guard didn't attach context (e.g. no Idempotency-Key header was sent).
    if (!idempotency) {
      return next.handle();
    }

    // Replay: short-circuit before the controller runs (spec section 16).
    if (idempotency.replay && idempotency.record) {
      const response = context.switchToHttp().getResponse<Response>();
      response.status(idempotency.record.statusCode ?? 200);
      return of(idempotency.record.response);
    }

    const replayErrors = options.replayErrors ?? false;

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        void this.idempotencyService.complete(
          idempotency.key,
          idempotency.requestHash,
          response.statusCode,
          data,
          idempotency.ttl,
        );
      }),
      catchError((error: unknown) => {
        if (replayErrors) {
          void this.idempotencyService.saveError(
            idempotency.key,
            idempotency.requestHash,
            this.extractStatusCode(error),
            this.serializeError(error),
            idempotency.ttl,
          );
        } else {
          void this.idempotencyService.delete(idempotency.key);
        }
        return throwError(() => error);
      }),
    );
  }

  private extractStatusCode(error: unknown): number {
    const err = error as { status?: number; getStatus?: () => number };
    if (typeof err?.getStatus === 'function') return err.getStatus();
    return err?.status ?? 500;
  }

  private serializeError(error: unknown): unknown {
    const err = error as {
      getResponse?: () => unknown;
      message?: string;
    };
    if (typeof err?.getResponse === 'function') {
      return err.getResponse();
    }
    return { message: err?.message ?? 'Internal error' };
  }
}
