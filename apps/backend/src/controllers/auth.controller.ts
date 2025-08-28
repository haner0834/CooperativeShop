// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import * as authService from "../services/auth.service";
import { generateTokens, verifyRefreshToken } from "../services/token.service";
import { AuthRequest, UserPayload } from "../types/auth.types";
import {
  UnauthorizedError,
  BadRequestError,
  InternalError,
  AppError,
} from "../types/error.types";
import prisma from "../config/db.config";
import passport from "passport";
import { env } from "../utils/env.utils";

const httpOnlyCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/api/auth",
} as const;

// --- Helper Function ---
const handleAuthSuccess = async (
  res: Response,
  user: User,
  deviceId?: string
) => {
  if (!deviceId) throw new BadRequestError("Device ID is required for login.");

  const account = await prisma.account.findFirst({
    where: { userId: user.id },
  });
  if (!account) throw new InternalError("User account link is missing.");

  const payload: UserPayload = {
    id: user.id,
    name: user.name,
    schoolId: user.schoolId,
  };
  const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
    await generateTokens(payload);

  // 建立或更新此設備的會話
  await prisma.authSession.upsert({
    where: { deviceId_accountId: { deviceId, accountId: account.id } },
    create: { deviceId, accountId: account.id, hashedRefreshToken },
    update: { hashedRefreshToken },
  });

  res.cookie("refreshToken", refreshToken, {
    ...httpOnlyCookieOptions,
    maxAge: cookieMaxAge,
  });

  // 取得此設備上所有已登入的帳號資訊，供前端顯示切換列表
  const sessions = await prisma.authSession.findMany({
    where: { deviceId },
    include: { account: { include: { user: true } } },
  });
  const switchableAccounts = sessions.map((s) => ({
    id: s.account.user.id,
    name: s.account.user.name,
    email: s.account.user.email,
  }));

  return {
    accessToken,
    refreshToken,
    cookieMaxAge,
    user: payload,
    switchableAccounts,
  };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { schoolId, studentId, name, password } = req.body;
    const deviceId = req.headers["x-device-id"] as string;
    if (!schoolId || !studentId || !name || !password || !deviceId)
      throw new BadRequestError("Missing information");

    const user = await authService.registerWithStudentId({
      schoolId,
      studentId,
      name,
      password,
    });

    const data = await handleAuthSuccess(res, user, deviceId);
    res.success(data);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { schoolId, studentId, password } = req.body;
    const deviceId = req.headers["x-device-id"] as string;

    if (!schoolId || !studentId || !password || !deviceId)
      throw new BadRequestError("Missing information");

    const user = await authService.loginWithStudentId({
      schoolId,
      studentId,
      password,
    });
    const data = await handleAuthSuccess(res, user, deviceId);
    res.success(data);
  } catch (error) {
    next(error);
  }
};

/**
 * [Authenticated via Cookie] 登出使用者
 * 刪除對應的 AuthSession 並清除 cookie
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;
    const deviceId = req.headers["x-device-id"] as string;

    // 如果沒有 token 或 deviceId，代表客戶端本來就沒有登入狀態，直接回傳成功
    if (currentRefreshToken && deviceId) {
      const decoded = verifyRefreshToken(currentRefreshToken);
      if (decoded && decoded.sub) {
        // 找到對應的 accountId
        const account = await prisma.account.findFirst({
          where: { userId: decoded.sub },
          select: { id: true },
        });

        if (account) {
          // 從資料庫刪除這個設備的會話記錄
          await prisma.authSession.deleteMany({
            where: {
              accountId: account.id,
              deviceId: deviceId,
            },
          });
        }
      }
    }

    res.cookie("refreshToken", "", {
      ...httpOnlyCookieOptions,
      maxAge: 0,
    });

    // 回傳成功訊息
    return res.success({ message: "Logged out successfully." }, undefined, 200);
  } catch (error) {
    next(error);
  }
};

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) return next(err); // If it's indeed an error, pass to global error handler

    if (!user) {
      // Failed to authorize, pass info.message and info.code as query parameters to frontend.
      const errorMsg = encodeURIComponent(info?.message || "Login failed");
      const errorCode = encodeURIComponent(info?.code || "UNKNOWN_ERROR");
      return res.redirect(
        `http://localhost:5173/login-failed?code=${errorCode}&message=${errorMsg}`
      );
    }
    // NOTE: Need to specify again as the `req` here is only `req` without `passport` middleware.
    req.user = user;

    return googleCallbackSuccess(req, res, next);
  })(req, res, next);
};

export const googleCallbackSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userWithDeviceId = req.user as User & { deviceId?: string };

    const { deviceId, ...user } = userWithDeviceId;
    if (!deviceId) {
      throw new BadRequestError("Device ID is required");
    }
    const data = await handleAuthSuccess(res, user, deviceId);
    const frontendUrl = env("FRONTEND_URL", "http://localhost:5173/home");
    res.redirect(frontendUrl);
  } catch (error) {
    if (error instanceof AppError) {
      res.redirect(
        `http://localhost:5173/login-failed?code=${error.code}&message=${error.message}&status=${error.statusCode}`
      );
      return;
    }
    next(error);
  }
};

// --- ✨ Refresh Token 核心實作 ---
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken: tokenFromCookie } = req.cookies;
    const deviceId = req.headers["x-device-id"] as string;

    if (!tokenFromCookie)
      throw new UnauthorizedError("No refresh token provided.");
    if (!deviceId) throw new BadRequestError("Device ID is missing.");

    const decoded = verifyRefreshToken(tokenFromCookie);
    if (!decoded || !decoded.sub)
      throw new UnauthorizedError("Invalid refresh token.");

    // 1. 尋找此設備上對應此使用者的會話
    const session = await prisma.authSession.findFirst({
      where: {
        deviceId,
        account: {
          userId: decoded.sub,
        },
      },
    });

    if (!session)
      throw new UnauthorizedError("Session not found. Please log in again.");

    // 2. 比較傳來的 Token 和資料庫中儲存的 Hash
    const isTokenMatch = await bcrypt.compare(
      tokenFromCookie,
      session.hashedRefreshToken
    );
    if (!isTokenMatch) {
      // 安全機制：如果 Token 不匹配，可能表示舊 Token 被盜用，立即刪除此設備的所有會話
      await prisma.authSession.deleteMany({ where: { deviceId } });
      throw new UnauthorizedError(
        "Token reuse detected. All sessions terminated."
      );
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) throw new UnauthorizedError("User not found.");

    // 3. 輪換 (Rotation)：產生一組全新的 Tokens
    const payload: UserPayload = {
      id: user.id,
      name: user.name,
      schoolId: user.schoolId,
    };
    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await generateTokens(payload);

    // 4. 更新資料庫中的 Hash 為新的 Hash
    await prisma.authSession.update({
      where: { id: session.id },
      data: { hashedRefreshToken },
    });

    // 5. 設定新的 Cookie
    res.cookie("refreshToken", refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: cookieMaxAge,
    });

    return res.success({ accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * [Authenticated via Cookie] 恢復使用者的登入會話
 * 根據 cookie 中的 refresh token 重新建立完整的認證狀態
 */
export const restoreSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;
    const deviceId = req.headers["x-device-id"] as string;

    if (!currentRefreshToken || !deviceId) {
      // 在這個情境下，沒有 token 或 deviceId 是正常情況，不應視為錯誤
      // 直接回傳失敗，讓前端知道沒有可恢復的 session
      return res.fail("NO_SESSION", "No active session to restore.", 401);
    }

    const decoded = verifyRefreshToken(currentRefreshToken);
    if (!decoded || !decoded.sub) {
      return res.fail("INVALID_TOKEN", "Invalid refresh token.", 401);
    }

    // 這裡的邏輯和 refreshToken 的驗證部分完全相同
    const session = await prisma.authSession.findFirst({
      where: { deviceId, account: { userId: decoded.sub } },
    });

    if (!session) {
      return res.fail("SESSION_NOT_FOUND", "Session not found.", 401);
    }

    const isTokenMatch = await bcrypt.compare(
      currentRefreshToken,
      session.hashedRefreshToken
    );
    if (!isTokenMatch) {
      // 為了安全，清除此設備的所有 session
      await prisma.authSession.deleteMany({ where: { deviceId } });
      return res.fail("TOKEN_REUSE_DETECTED", "Token reuse detected.", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return res.fail("USER_NOT_FOUND", "User not found.", 401);
    }

    // ✨ 核心區別：不僅刷新 token，還要回傳完整的登入資料
    // 我們可以重用 handleAuthSuccess 函式來達成這個目的！
    // 注意：handleAuthSuccess 已經包含了 token 輪換的邏輯
    const data = await handleAuthSuccess(res, user, deviceId);
    res.success(data);
  } catch (error) {
    next(error);
  }
};

export const switchAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { targetUserId } = req.body;
    const deviceId = req.headers["x-device-id"] as string;

    if (!targetUserId) throw new BadRequestError("Target User ID is required.");
    if (!deviceId) throw new BadRequestError("Device ID is missing.");

    // 尋找目標帳號在此設備上的 session
    const targetSession = await prisma.authSession.findFirst({
      where: { deviceId, account: { userId: targetUserId } },
      include: { account: { include: { user: true } } },
    });

    if (!targetSession)
      throw new UnauthorizedError(
        "Target account is not logged in on this device."
      );

    // 為目標帳號產生新的 Tokens
    const { user } = targetSession.account;
    const payload: UserPayload = {
      id: user.id,
      name: user.name,
      schoolId: user.schoolId,
    };
    // 這裡我們進行一次完整的輪換
    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await generateTokens(payload);

    await prisma.authSession.update({
      where: { id: targetSession.id },
      data: { hashedRefreshToken },
    });

    res.cookie("refreshToken", refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: cookieMaxAge,
    });

    return res.success({ accessToken, user: payload });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { schoolId, deviceId } = req.query;

  if (!schoolId || typeof schoolId !== "string") {
    return res.status(400).json({ message: "School ID is required." });
  }

  if (!deviceId || typeof deviceId !== "string") {
    return res.status(400).json({ message: "Device ID is required." });
  }

  // 檢查學校是否存在且有 emailFormat
  const school = await prisma.school.findUnique({ where: { id: schoolId } });

  if (!school || !school.emailFormats) {
    throw new BadRequestError("This school does not support Google login.");
  }

  // 將 schoolId 編碼到 state 中，防止 CSRF 攻擊並傳遞必要資訊
  const state = Buffer.from(JSON.stringify({ schoolId, deviceId })).toString(
    "base64"
  );

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state, // 將編碼後的 state 傳給 Google
  })(req, res, next);
};
