import { Injectable } from '@nestjs/common';
import { DeviceType, School, type User } from '@prisma/client';
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
import { UAParser } from 'ua-parser-js';
import { CloudflareContext } from 'src/common/interceptors/cloudflare-context.interceptor';

export interface GoogleProfile {
  id: string;
  displayName: string;
  email: string;
}

export interface AuthMeta extends CloudflareContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  private readonly SALT_ROUNDS = 10;

  async authSuccess(user: User, deviceId: string, meta?: AuthMeta) {
    if (!deviceId) {
      throw new BadRequestError(
        'MISSING_DEVICE_ID',
        'Device ID is required for login.',
      );
    }

    const account = await this.prisma.account.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            school: {
              select: { abbreviation: true, isLimited: true, name: true },
            },
          },
        },
      },
    });
    if (!account || !account.user.school) {
      throw new InternalError(
        'Data integrity error: Account or School missing.',
      );
    }

    const payload: UserPayload = {
      id: user.id,
      accountId: account.id,
      name: user.name,
      schoolId: user.schoolId,
      schoolAbbr: account.user.school.abbreviation,
      schoolName: account.user.school.name,
      isSchoolLimited: account.user.school.isLimited,
      studentId: account.user.studentId ?? undefined,
      email: account.user.email ?? undefined,
      provider: account.provider as any,
      joinAt: account.user.createAt.toISOString(),
    };

    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateTokens(payload);

    const expiresAt = new Date(Date.now() + cookieMaxAge);

    // 建立或更新此設備的會話
    await this.prisma.authSession.upsert({
      where: { deviceId_accountId: { deviceId, accountId: account.id } },
      create: {
        deviceId,
        accountId: account.id,
        hashedRefreshToken,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        ...this.parseUA(meta?.userAgent),
        expiresAt,
      },
      update: {
        hashedRefreshToken,
        ipAddress: meta?.ip,
        expiresAt,
        city: meta?.city,
        country: meta?.country,
      },
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
    const existingUser = await this.prisma.user.findUnique({
      where: {
        schoolId_studentId: {
          schoolId: data.schoolId,
          studentId: data.studentId,
        },
      },
      select: { name: true },
    });
    if (existingUser)
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
      throw new BadRequestError('INVALID_CREDENTIAL', 'Invalid credentials.');
    }

    const passwordMatch = await bcrypt.compare(
      data.password,
      account.password!,
    );
    if (!passwordMatch) {
      throw new BadRequestError('INVALID_CREDENTIAL', 'Invalid credentials.');
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

  async rotateRefreshToken(
    tokenFromCookie: string,
    deviceId: string,
    ipAddress?: string,
    cf?: CloudflareContext,
  ) {
    if (!tokenFromCookie)
      throw new UnauthorizedError('No refresh token provided.');
    if (!deviceId)
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is missing.');

    const decoded = this.tokenService.verifyRefreshToken(tokenFromCookie);
    if (!decoded || !decoded.sub || !decoded.accountId)
      throw new UnauthorizedError('Invalid refresh token.');

    // 1. 找 session
    const session = await this.prisma.authSession.findUnique({
      where: {
        deviceId_accountId: {
          deviceId,
          accountId: decoded.accountId,
        },
      },
      select: {
        id: true,
        hashedRefreshToken: true,
        account: {
          select: {
            id: true,
            providerAccountId: true,
            provider: true,
            user: {
              include: {
                school: true,
              },
            },
          },
        },
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

    // 3. 產生新 token
    const payload: UserPayload = {
      id: session.account.user.id,
      accountId: session.account.id,
      name: session.account.user.name,
      schoolId: session.account.user.school.id,
      schoolAbbr: session.account.user.school.abbreviation,
      schoolName: session.account.user.school.name,
      isSchoolLimited: session.account.user.school.isLimited,
      studentId: session.account.user.studentId ?? undefined,
      email: session.account.user.email ?? undefined,
      provider: session.account.provider as any,
      joinAt: session.account.user.createAt.toISOString(),
    };
    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateTokens(payload);

    const expiresAt = new Date(Date.now() + cookieMaxAge);

    // 4. 更新資料庫
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        hashedRefreshToken,
        expiresAt,
        ipAddress,
        country: cf?.country,
        city: cf?.city,
      },
    });

    return { accessToken, refreshToken, cookieMaxAge };
  }

  async switchAccount(
    targetUserId: string,
    deviceId: string,
    ipAddress?: string,
    cf?: CloudflareContext,
  ) {
    if (!targetUserId)
      throw new BadRequestError(
        'MISSING_TARGET_UID',
        'Target User ID is required.',
      );
    if (!deviceId)
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is missing.');

    // 尋找目標帳號在此設備上的 session
    const targetSession = await this.prisma.authSession.findFirst({
      where: { deviceId, account: { userId: targetUserId } },
      select: {
        id: true,
        account: {
          select: {
            id: true,
            provider: true,
            providerAccountId: true,
            user: {
              include: {
                school: {
                  select: {
                    name: true,
                    abbreviation: true,
                    isLimited: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!targetSession)
      throw new UnauthorizedError(
        'Target account is not logged in on this device.',
      );

    // 為目標帳號產生新的 Tokens
    const { user } = targetSession.account;
    const payload: UserPayload = {
      id: user.id,
      accountId: targetSession.account.id,
      name: user.name,
      schoolId: user.schoolId,
      schoolAbbr: user.school.abbreviation,
      schoolName: user.school.name,
      isSchoolLimited: user.school.isLimited,
      studentId: targetSession.account.user.studentId ?? undefined,
      email: targetSession.account.user.email ?? undefined,
      provider: targetSession.account.provider as any,
      joinAt: targetSession.account.user.createAt.toISOString(),
    };
    // 這裡我們進行一次完整的輪換
    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateTokens(payload);

    await this.prisma.authSession.update({
      where: { id: targetSession.id },
      data: {
        hashedRefreshToken,
        ipAddress,
        country: cf?.country,
        city: cf?.city,
      },
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
    if (!decoded || !decoded.sub || !decoded.accountId) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token.', 401);
    }

    // 這裡的邏輯和 refreshToken 的驗證部分完全相同
    const session = await this.prisma.authSession.findUnique({
      where: {
        deviceId_accountId: {
          deviceId,
          accountId: decoded.accountId,
        },
      },
      select: {
        hashedRefreshToken: true,
        account: {
          select: {
            user: true,
          },
        },
      },
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

    if (!session.account.user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.', 401);
    }

    return session.account.user;
  }

  private parseUA(uaString?: string) {
    const parser = new UAParser(uaString);
    return {
      deviceType: this.parseDeviceType(parser),
      browser: this.parseBrowserName(parser),
    };
  }

  private parseDeviceType(parser: UAParser): DeviceType {
    const device = parser.getDevice();
    const os = parser.getOS().name;

    if (os === 'iOS') {
      if (device.model === 'iPad' || device.type === 'tablet') {
        return 'IPAD';
      }
      return 'IPHONE';
    }

    if (os === 'Android') return 'ANDROID';
    if (os === 'Windows') return 'WINDOWS';
    if (os === 'Mac OS') return 'MAC';

    return 'OTHER';
  }

  private parseBrowserName(parser: UAParser): string {
    const browser = parser.getBrowser();
    return browser.name ?? 'Unknown';
  }
}
