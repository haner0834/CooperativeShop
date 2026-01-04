import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface CloudflareContext {
  country?: string;
  city?: string;
}

@Injectable()
export class CloudflareContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const h = req.headers;

    req.cf = {
      country: header(h, 'cf-ipcountry'),
      city: header(h, 'cf-city'),
    };

    return next.handle();
  }
}

function header(
  headers: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return typeof v === 'string' ? v : undefined;
}
