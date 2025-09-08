import { NextFunction, Request, Response } from "express";
import { AppError } from "../types/error.types";

/**
 * 檢查請求的 Content-Type 是否為 application/json 的 Middleware
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const jsonContentTypeCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 對於 GET, HEAD, DELETE 等通常沒有 request body 的請求，直接跳過檢查
  if (["GET", "HEAD", "DELETE", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const contentType = req.get("Content-Type");

  // 檢查 Content-Type header 是否存在且包含 'application/json'
  // 使用 .includes() 是為了相容 'application/json; charset=utf-8' 這種情況
  if (!contentType || !contentType.includes("application/json")) {
    const error = new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Unsupported Media Type: Server only accepts application/json",
      415
    );
    return next(error);
  }

  next();
};
