// I wrap NestJS HttpException into project-specific subclasses to guarantee every error response contains a code.
// ** Do not use Nest’s built-in exceptions directly. **

import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly code: string;

  constructor(code: string, message: string, statusCode: number) {
    super({ code, message }, statusCode);
    this.code = code;
  }
}

export class NotFoundError extends AppException {
  constructor(resourceName = '', message = 'Resource not found.') {
    super(
      `${resourceName ? resourceName.toUpperCase() + '_' : ''}NOT_FOUND`,
      message,
      404,
    );
  }
}

export class UnauthorizedError extends AppException {
  constructor(message = 'Authentication failed.') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class BadRequestError extends AppException {
  constructor(message = 'Bad request.') {
    super('BAD_REQUEST', message, 400);
  }
}

export class InternalError extends AppException {
  constructor(message = 'Internal server error.') {
    super('INTERNAL_SERVER_ERROR', message, 500);
  }
}

export class PermissionError extends AppException {
  constructor(message = 'No permission to access the data.') {
    super('NO_PERMISSION', message, 403);
  }
}

export class AuthError extends AppException {
  constructor(code: string, message: string, statusCode = 403) {
    super(code, message, statusCode);
    this.name = 'AuthError';
  }
}
