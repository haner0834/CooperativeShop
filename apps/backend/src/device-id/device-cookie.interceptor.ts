import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { DeviceIdService } from 'src/device-id/device-id.service';
import { DeviceIdContext } from './types/device-id-context';

@Injectable()
export class DeviceCookieInterceptor implements NestInterceptor {
  constructor(private readonly deviceIdService: DeviceIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse<Response>();

        const { deviceId, shouldSetCookie }: DeviceIdContext =
          req['__device_id_context__'] || {};

        if (shouldSetCookie && deviceId) {
          const signedValue = this.deviceIdService.signDeviceId(deviceId);

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
