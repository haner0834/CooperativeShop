import jwt from "jsonwebtoken";
import {
  GeneratedRefreshToken,
  UserPayload,
  Tokens,
} from "../types/auth.types";
import crypto from "crypto";
import bcrypt from "bcrypt";
import ms from "ms";
import { env } from "../utils/env.utils";

const SALT_ROUNDS = 10;
const JWT_ACCESS_SECRET = env("JWT_ACCESS_SECRET");
const JWT_REFRESH_SECRET = env("JWT_REFRESH_SECRET");
const JWT_ACCESS_EXPIRES_IN: ms.StringValue = "15m";
const JWT_REFRESH_EXPIRES_IN: ms.StringValue = "30d";

export const getRefreshTokenMaxAge = (trustDevice: boolean): number => {
  return (trustDevice ? 7 : 30) * 24 * 60 * 60 * 1000;
};

export const generateAccessToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    subject: payload.id,
  });
};

export const generateRefreshToken = async (
  studentId: string
): Promise<GeneratedRefreshToken> => {
  const payload = { jti: crypto.randomBytes(16).toString("hex") };
  // Refresh Token 的過期時間改為固定，例如 30 天
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
    subject: studentId,
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  const hash = await bcrypt.hash(token, SALT_ROUNDS);
  return { token, hash };
};

export const generateTokens = async (payload: UserPayload): Promise<Tokens> => {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
  const { token: refreshToken, hash: hashedRefreshToken } =
    await generateRefreshToken(payload.id);

  return {
    accessToken,
    refreshToken,
    hashedRefreshToken, // 我們需要這個來存入資料庫
    cookieMaxAge: ms("30d"), // Cookie 過期時間與 Token 一致
  };
};
export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "name" in decoded
    ) {
      return decoded as UserPayload;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return typeof decoded === "object" ? decoded : null;
  } catch (error) {
    return null;
  }
};
