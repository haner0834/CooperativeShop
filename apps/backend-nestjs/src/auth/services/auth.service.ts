import { Injectable } from '@nestjs/common';
import { School, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { validateStudentId } from '../../validators/studentId.validator';
import { validateEmailAndStudentId } from '../../validators/email.validator';
import {
  AppError,
  AuthError,
  BadRequestError,
  InternalError,
  UnauthorizedError,
} from '../../types/error.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { env } from 'src/common/utils/env.utils';
import { TokenService } from './token.service';
import { UserPayload } from '../types/auth.types';

export interface GoogleProfile {
  id: string;
  displayName: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  private readonly SALT_ROUNDS = Number(env('SALT_ROUNDS'));

  async authSuccess(user: User, deviceId: string) {
    if (!deviceId) {
      throw new BadRequestError('Device ID is required for login.');
    }

    const account = await this.prisma.account.findFirst({
      where: { userId: user.id },
    });
    if (!account) {
      throw new InternalError('User account link is missing.');
    }

    const payload = {
      id: user.id,
      name: user.name,
      schoolId: user.schoolId,
    };

    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateTokens(payload);

    // 建立或更新此設備的會話
    await this.prisma.authSession.upsert({
      where: { deviceId_accountId: { deviceId, accountId: account.id } },
      create: { deviceId, accountId: account.id, hashedRefreshToken },
      update: { hashedRefreshToken },
    });

    // 取得此設備上所有已登入的帳號資訊
    const sessions = await this.prisma.authSession.findMany({
      where: { deviceId },
      include: { account: { include: { user: true } } },
    });

    const switchableAccounts = sessions.map((s) => ({
      id: s.account.user.id,
      name: s.account.user.name,
      email: s.account.user.email,
      providerAccountId: s.account.providerAccountId,
      schoolId: s.account.user.studentId,
    }));

    return {
      accessToken,
      refreshToken,
      cookieMaxAge,
      user: payload,
      switchableAccounts,
    };
  }

  async registerWithStudentId(data: {
    schoolId: string;
    studentId: string;
    name: string;
    password: string;
  }): Promise<User> {
    const student = await this.prisma.user.findUnique({
      where: { id: data.studentId },
      select: { name: true },
    });
    if (student)
      throw new AppError(
        'EXISTING_USER',
        'A user with given studentId is already existing.',
        409,
      );

    const school = await this.prisma.school.findUnique({
      where: { id: data.schoolId },
    });
    if (!school) throw new InternalError('School not found.');

    if (!validateStudentId(data.studentId, school.studentIdFormat)) {
      throw new AppError(
        'INVALID_STUDENT_ID_FORMAT',
        'Invalid Student ID format.',
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          studentId: data.studentId,
          schoolId: data.schoolId,
        },
      });

      await tx.account.create({
        data: {
          userId: newUser.id,
          provider: 'credentials',
          providerAccountId: data.studentId,
          password: hashedPassword,
        },
      });
      return newUser;
    });

    return user;
  }

  async loginWithStudentId(data: {
    schoolId: string;
    studentId: string;
    password: string;
  }): Promise<User> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: data.studentId,
        },
      },
      include: { user: true },
    });

    // 確保使用者屬於指定的學校
    if (!account || account.user.schoolId !== data.schoolId) {
      throw new BadRequestError('Invalid credentials.');
    }

    const passwordMatch = await bcrypt.compare(
      data.password,
      account.password!,
    );
    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials.');
    }

    return account.user;
  }

  async findOrCreateUserByGoogle(
    profile: GoogleProfile,
    school: School,
  ): Promise<User> {
    if (!validateEmailAndStudentId(profile.email, school)) {
      throw new AuthError(
        'EMAIL_SCHOOL_MISMATCH',
        "Email address does not match any of the school's required formats.",
      );
    }

    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.id,
        },
      },
      include: { user: true },
    });

    if (existingAccount) return existingAccount.user;

    // 交易：尋找或建立 User，然後建立 Account
    return await this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: profile.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            name: profile.displayName,
            email: profile.email,
            schoolId: school.id,
          },
        });
      }

      await tx.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: profile.id,
        },
      });
      return user;
    });
  }

  async logout(currentRefreshToken: string, deviceId: string) {
    if (currentRefreshToken && deviceId) {
      const decoded = this.tokenService.verifyRefreshToken(currentRefreshToken);
      if (decoded && decoded.sub) {
        // 找到對應的 accountId
        const account = await this.prisma.account.findFirst({
          where: { userId: decoded.sub },
          select: { id: true },
        });

        if (account) {
          // 從資料庫刪除這個設備的會話記錄
          await this.prisma.authSession.deleteMany({
            where: {
              accountId: account.id,
              deviceId: deviceId,
            },
          });
        }
      }
    }
  }

  async rotateRefreshToken(tokenFromCookie: string, deviceId: string) {
    if (!tokenFromCookie)
      throw new UnauthorizedError('No refresh token provided.');
    if (!deviceId) throw new BadRequestError('Device ID is missing.');

    const decoded = this.tokenService.verifyRefreshToken(tokenFromCookie);
    if (!decoded || !decoded.sub)
      throw new UnauthorizedError('Invalid refresh token.');

    // 1. 找 session
    const session = await this.prisma.authSession.findFirst({
      where: {
        deviceId,
        account: { userId: decoded.sub },
      },
    });
    if (!session)
      throw new UnauthorizedError('Session not found. Please log in again.');

    // 2. 比對 token
    const isTokenMatch = await bcrypt.compare(
      tokenFromCookie,
      session.hashedRefreshToken,
    );
    if (!isTokenMatch) {
      await this.prisma.authSession.deleteMany({ where: { deviceId } });
      throw new UnauthorizedError(
        'Token reuse detected. All sessions terminated.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) throw new UnauthorizedError('User not found.');

    // 3. 產生新 token
    const payload: UserPayload = {
      id: user.id,
      name: user.name,
      schoolId: user.schoolId,
    };
    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateTokens(payload);

    // 4. 更新資料庫
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { hashedRefreshToken },
    });

    return { accessToken, refreshToken, cookieMaxAge };
  }

  async switchAccount(targetUserId: string, deviceId: string) {
    if (!targetUserId) throw new BadRequestError('Target User ID is required.');
    if (!deviceId) throw new BadRequestError('Device ID is missing.');

    // 尋找目標帳號在此設備上的 session
    const targetSession = await this.prisma.authSession.findFirst({
      where: { deviceId, account: { userId: targetUserId } },
      include: { account: { include: { user: true } } },
    });

    if (!targetSession)
      throw new UnauthorizedError(
        'Target account is not logged in on this device.',
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
      await this.tokenService.generateTokens(payload);

    await this.prisma.authSession.update({
      where: { id: targetSession.id },
      data: { hashedRefreshToken },
    });

    return { accessToken, refreshToken, cookieMaxAge, user: payload };
  }

  async restoreSession(currentRefreshToken: string, deviceId: string) {
    if (!currentRefreshToken || !deviceId) {
      // 在這個情境下，沒有 token 或 deviceId 是正常情況，不應視為錯誤
      // 直接回傳失敗
      throw new AppError('NO_SESSION', 'No active session to restore.', 401);
    }

    const decoded = this.tokenService.verifyRefreshToken(currentRefreshToken);
    if (!decoded || !decoded.sub) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token.', 401);
    }

    // 這裡的邏輯和 refreshToken 的驗證部分完全相同
    const session = await this.prisma.authSession.findFirst({
      where: { deviceId, account: { userId: decoded.sub } },
    });

    if (!session) {
      throw new AppError('SESSION_NOT_FOUND', 'Session not found.', 401);
    }

    const isTokenMatch = await bcrypt.compare(
      currentRefreshToken,
      session.hashedRefreshToken,
    );
    if (!isTokenMatch) {
      // 為了安全，清除此設備的所有 session
      await this.prisma.authSession.deleteMany({ where: { deviceId } });
      throw new AppError('TOKEN_REUSE_DETECTED', 'Token reuse detected.', 401);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.', 401);
    }

    return user;
  }
}
