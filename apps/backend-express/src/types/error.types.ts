export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName = "", message = "Resource not found.") {
    super(
      `${resourceName ? resourceName.toUpperCase() + "_" : ""}NOT_FOUND`,
      message,
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication failed.") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request.") {
    super("BAD_REQUEST", message, 400);
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error.") {
    super("INTERNAL_SERVER_ERROR", message, 500);
  }
}

export class PermissionError extends AppError {
  constructor(message = "No permission to access the data.") {
    super("NO_PERMISSION", message, 403);
  }
}

export class AuthError extends AppError {
  constructor(code: string, message: string, statusCode = 403) {
    super(code, message, statusCode);
    this.name = "AuthError";
  }
}
