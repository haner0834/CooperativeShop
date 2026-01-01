import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RateLimitService } from './rate-limit.service';
import { Response } from 'express';

@Injectable()
export class DeviceCookieInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse<Response>();

        const { deviceId, shouldSetCookie } = req['rateLimitContext'] || {};

        if (shouldSetCookie && deviceId) {
          const signedValue = this.rateLimitService.signDeviceId(deviceId);

          res.cookie('d_id', signedValue, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            path: '/',
          });
        }
      }),
    );
  }
}
