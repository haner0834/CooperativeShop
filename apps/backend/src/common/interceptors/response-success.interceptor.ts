import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from 'src/types/api.types';

export class MetaContext<T> {
  constructor(
    public readonly data: T,
    public readonly meta: Record<string, any> = {},
  ) {}
}

/**
 * A interceptor used to wrap response to a certain shape
 *
 * return `MetaContext` if you want to add metadata
 */
@Injectable()
export class SuccessResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccess<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof MetaContext) {
          const response: ApiSuccess<T> = {
            success: true,
            data: data.data,
            meta: data.meta,
            error: null,
          };
          return response;
        }

        const response: ApiSuccess<T> = {
          success: true,
          data,
          meta: undefined,
          error: null,
        };
        return response;
      }),
    );
  }
}
