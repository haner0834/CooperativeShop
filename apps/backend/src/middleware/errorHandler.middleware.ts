import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error.types";
import { Prisma } from "@prisma/client";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("💥 An error occurred:", err);

  if (err instanceof AppError) {
    return res.fail(err.code, err.message, err.statusCode);
  }

  // 處理 Prisma 特有的錯誤
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ");
      return res.fail(
        "DUPLICATE_ENTRY",
        `An entry with this ${target} already exists.`,
        409
      );
    }
  }

  return res.internalServerError("An unexpected error occurred on the server.");
};
