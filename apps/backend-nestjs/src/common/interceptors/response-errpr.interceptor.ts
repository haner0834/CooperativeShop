import {
  Injectable,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiError } from 'src/types/api.types';
import { AppException } from 'src/types/error.types';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode: number;
    let errorCode: string;
    let errorMessage: string;

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      errorCode = exception.code;

      const responseBody = exception.getResponse();
      if (typeof responseBody === 'object' && responseBody !== null) {
        errorMessage = (responseBody as any).message || exception.message;
      } else {
        errorMessage = exception.message;
      }
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorCode = this.getErrorCodeByStatus(statusCode);

      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        errorMessage = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const response = responseBody as any;
        errorMessage = response.message || response.error || 'HTTP Exception';
      } else {
        errorMessage = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      errorMessage = 'Internal server error';

      console.error('Unhandled exception:', exception);
    }

    const errorResponse: ApiError = {
      success: false,
      data: null,
      error: {
        code: errorCode,
        message: errorMessage,
      },
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
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusMap[statusCode] || 'UNKNOWN_ERROR';
  }
}
