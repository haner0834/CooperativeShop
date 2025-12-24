import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { RateLimitService } from './rate-limit.service';
import { HttpException } from '@nestjs/common';

@Injectable()
export class RiskAssessmentInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'];

    return next.handle().pipe(
      // 成功請求可以降低或保留風險分數
      tap(() => {
        // 可選：成功請求降低風險值
        // await this.rateLimitService.decreaseRiskScore(ip, 1);
      }),
      catchError((err) => {
        let score = 0;

        if (err instanceof HttpException) {
          // AppError is HttpException
          const status = err.getStatus();

          if (status === 401 || status === 403) {
            score = 2; // 高風險
          } else if (status >= 400 && status < 500) {
            score = 1; // 輕微風險
          } else if (status >= 500) {
            score = 1; // 服務端錯誤也可能增加風險
          }
        } else {
          // 非 HttpException 錯誤，也可加分
          score = 1;
        }

        if (score > 0) {
          // Fire-and-forget 方式，不阻塞回傳
          void this.rateLimitService.addRiskScore(ip, score).catch(() => {});
        }

        // 將錯誤往上丟，交給 global exception filter 處理
        return throwError(() => err);
      }),
    );
  }
}
