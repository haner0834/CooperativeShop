import { Response } from "express";
import { AuthRequest } from "./auth.types";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: any;
  error: null;
};

export type ApiError = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type TypedResponse<T> = Response<ApiResponse<T>>;

export type AuthHandler<T> = (req: AuthRequest, res: TypedResponse<T>) => void;
