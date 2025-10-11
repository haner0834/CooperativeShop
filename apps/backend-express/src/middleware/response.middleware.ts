import { Request, Response, NextFunction } from "express";
import type { ApiSuccess, ApiError } from "../types/api.types";

declare module "express-serve-static-core" {
  interface Response {
    success: <T>(data: T, meta?: any, statusCode?: number) => Response;
    fail: (code: string, message: string, statusCode?: number) => Response;
    internalServerError: (message: string) => Response;
    noStudentId: () => Response;
  }
}

export const responseExtender = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.success = <T>(data: T, meta?: any, statusCode = 200) => {
    const body: ApiSuccess<T> = {
      success: true,
      data,
      meta,
      error: null,
    };
    return res.status(statusCode).json(body);
  };

  res.fail = (code: string, message: string, statusCode = 400) => {
    const body: ApiError = {
      success: false,
      data: null,
      error: { code, message },
    };
    return res.status(statusCode).json(body);
  };

  res.internalServerError = (message: string) => {
    const body: ApiError = {
      success: false,
      data: null,
      error: { code: "INTERNAL_SERVER_ERROR", message },
    };
    return res.status(500).json(body);
  };

  res.noStudentId = () => {
    const body: ApiError = {
      success: false,
      data: null,
      error: {
        code: "NO_SID",
        message: "Authentication error: Student ID is missing.",
      },
    };
    return res.status(401).json(body);
  };

  next();
};
