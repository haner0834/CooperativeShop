import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error.types";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[ERROR]", err);

  if (err instanceof AppError) {
    return res.fail(err.code, err.message, err.statusCode);
  }

  // 請求 Body 的 JSON 格式錯誤
  if (err instanceof SyntaxError && "body" in err) {
    return res.fail(
      "INVALID_JSON_FORMAT",
      "Request body contains invalid JSON.",
      400
    );
  }

  // Unexpected
  return res.internalServerError("An unexpected error occurred on the server.");
};
