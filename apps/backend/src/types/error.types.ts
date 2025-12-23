// I wrap NestJS HttpException into project-specific subclasses to guarantee every error response contains a code.
// ** Do not use Nest’s built-in exceptions directly. **

import { HttpException } from '@nestjs/common';

export class AppError extends HttpException {
  public readonly code: string;

  constructor(code: string, message: string, statusCode: number) {
    super({ code, message }, statusCode);
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName = '', message = 'Resource not found.') {
    super(
      `${resourceName ? resourceName.toUpperCase() + '_' : ''}NOT_FOUND`,
      message,
      404,
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication failed.') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error.') {
    super('INTERNAL_SERVER_ERROR', message, 500);
  }
}

export class PermissionError extends AppError {
  constructor(message = 'No permission to access the data.') {
    super('NO_PERMISSION', message, 403);
  }
}

export class AuthError extends AppError {
  constructor(code: string, message: string, statusCode = 403) {
    super(code, message, statusCode);
    this.name = 'AuthError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super('TOO_MANY_REQUESTS', message, 429);
  }
}
