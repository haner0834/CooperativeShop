import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/token.service";
import { UnauthorizedError } from "../types/error.types";
import { AuthRequest } from "../types/auth.types";

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token.");
    }

    req.bitch = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
