import {
  Injectable,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiError } from 'src/types/api.types';
import { AppError, TooManyRequestsError } from 'src/types/error.types';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (response.headersSent) return;

    let statusCode: number;
    let errorCode: string;
    let errorMessage: string;

    const meta = {
      path: request.url,
      method: request.method,
      params: request.params,
      query: request.query,
      body: this.redact(request.body),
      headers: {
        'content-type': request.headers['content-type'],
        'user-agent': request.headers['user-agent'],
      },
    };

    if (exception instanceof AppError) {
      statusCode = exception.getStatus();
      errorCode = exception.code;

      const responseBody = exception.getResponse();
      errorMessage =
        typeof responseBody === 'object' && responseBody !== null
          ? (responseBody as any).message || exception.message
          : exception.message;

      this.logger.warn(`[${errorCode}] ${errorMessage}`, meta);
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorCode = this.getErrorCodeByStatus(statusCode);

      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        errorMessage = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const resp = responseBody as any;
        errorMessage = resp.message || resp.error || 'HTTP Exception';
      } else {
        errorMessage = exception.message;
      }

      this.logger.warn(`[${errorCode}] ${errorMessage}`, meta);
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      errorMessage = 'Internal server error';

      const exceptionInfo = {
        message: (exception as any)?.message,
        name: (exception as any)?.name,
        stack: (exception as any)?.stack,
      };

      // Winston can handle objects as meta
      this.logger.error('Unhandled exception', { exceptionInfo, ...meta });
    }

    if (exception instanceof TooManyRequestsError) {
      response.header('Retry-After', `${exception.retryAfterSec}`);
    }

    const errorResponse: ApiError = {
      success: false,
      data: null,
      error: { code: errorCode, message: errorMessage },
    };

    response.status(statusCode).json(errorResponse);
  }

  private getErrorCodeByStatus(statusCode: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUEST',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusMap[statusCode] || 'UNKNOWN_ERROR';
  }

  private redact(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const clone: any = Array.isArray(obj) ? [] : {};
    for (const key of Object.keys(obj)) {
      const sensitiveFields = [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'refreshToken',
        'accessToken',
        'signature',
      ];
      if (sensitiveFields.includes(key.toLowerCase())) {
        clone[key] = '[REDACTED]';
      } else {
        clone[key] = obj[key];
      }
    }
    return clone;
  }
}
