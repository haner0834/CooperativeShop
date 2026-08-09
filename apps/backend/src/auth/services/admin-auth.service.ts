// src/auth/services/admin-auth.service.ts
import { Injectable } from '@nestjs/common';
import { Admin, AdminLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';
import { AdminService } from './admin.service';
import { hashPassword, verifyPassword } from 'src/common/utils/password.utils';
import {
  AdminAuthMeta,
  AdminInviteInfo,
  AdminPayload,
} from '../types/admin-auth.types';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
} from 'src/types/error.types';

// 邀請連結預設 7 天過期，之後要開放前端自訂再拉出去當參數即可
const INVITE_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly adminService: AdminService,
  ) {}

  // ================= 登入 / Session =================

  async adminLogin(
    email: string,
    password: string,
    deviceId: string,
    meta?: AdminAuthMeta,
  ) {
    if (!deviceId) {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is required.');
    }

    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: email,
        },
      },
      include: { admin: true },
    });

    if (
      !account ||
      account.role !== 'ADMIN' ||
      !account.admin ||
      !account.admin.isActive ||
      !account.password
    ) {
      throw new BadRequestError('INVALID_CREDENTIAL', 'Invalid credentials.');
    }

    const passwordMatch = await verifyPassword(
      password,
      account.admin.salt,
      account.password,
    );
    if (!passwordMatch) {
      throw new BadRequestError('INVALID_CREDENTIAL', 'Invalid credentials.');
    }

    await this.prisma.admin.update({
      where: { id: account.admin.id },
      data: { lastLoginAt: new Date(), lastLoginIp: meta?.ip },
    });

    return this.issueSession(account.id, account.admin, deviceId, meta);
  }

  async adminRotateRefreshToken(
    tokenFromCookie: string,
    deviceId: string,
    meta?: AdminAuthMeta,
  ) {
    if (!tokenFromCookie) {
      throw new UnauthorizedError('No refresh token provided.');
    }
    if (!deviceId) {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is missing.');
    }

    const decoded = this.tokenService.verifyAdminRefreshToken(tokenFromCookie);
    if (!decoded || !decoded.accountId) {
      throw new UnauthorizedError('Invalid refresh token.');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { deviceId_accountId: { deviceId, accountId: decoded.accountId } },
      select: {
        id: true,
        hashedRefreshToken: true,
        account: { select: { id: true, role: true, admin: true } },
      },
    });

    if (
      !session ||
      session.account.role !== 'ADMIN' ||
      !session.account.admin ||
      !session.account.admin.isActive
    ) {
      throw new UnauthorizedError('Session not found. Please log in again.');
    }

    const isTokenMatch = await bcrypt.compare(
      tokenFromCookie,
      session.hashedRefreshToken,
    );
    if (!isTokenMatch) {
      // 偵測到 refresh token 重放，比照學生端做法：整個 device 的 session 全部撤銷
      await this.prisma.authSession.deleteMany({ where: { deviceId } });
      throw new UnauthorizedError(
        'Token reuse detected. All sessions terminated.',
      );
    }

    return this.issueSession(
      session.account.id,
      session.account.admin,
      deviceId,
      meta,
    );
  }

  async adminRestoreSession(
    refreshToken: string,
    deviceId: string,
    meta?: AdminAuthMeta,
  ) {
    if (!refreshToken || !deviceId) {
      throw new AppError('NO_SESSION', 'No active session to restore.', 401);
    }

    const decoded = this.tokenService.verifyAdminRefreshToken(refreshToken);
    if (!decoded || !decoded.accountId) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token.', 401);
    }

    const session = await this.prisma.authSession.findUnique({
      where: { deviceId_accountId: { deviceId, accountId: decoded.accountId } },
      select: {
        hashedRefreshToken: true,
        account: { select: { id: true, role: true, admin: true } },
      },
    });

    if (
      !session ||
      session.account.role !== 'ADMIN' ||
      !session.account.admin ||
      !session.account.admin.isActive
    ) {
      throw new AppError('SESSION_NOT_FOUND', 'Session not found.', 401);
    }

    const isTokenMatch = await bcrypt.compare(
      refreshToken,
      session.hashedRefreshToken,
    );
    if (!isTokenMatch) {
      await this.prisma.authSession.deleteMany({ where: { deviceId } });
      throw new AppError('TOKEN_REUSE_DETECTED', 'Token reuse detected.', 401);
    }

    return this.issueSession(
      session.account.id,
      session.account.admin,
      deviceId,
      meta,
    );
  }

  async adminLogout(refreshToken: string | undefined, deviceId: string) {
    if (!refreshToken || !deviceId) return;

    const decoded = this.tokenService.verifyAdminRefreshToken(refreshToken);
    if (decoded?.accountId) {
      await this.prisma.authSession.deleteMany({
        where: { accountId: decoded.accountId, deviceId },
      });
    }
  }

  private async issueSession(
    accountId: string,
    admin: Admin,
    deviceId: string,
    meta?: AdminAuthMeta,
  ) {
    const payload: AdminPayload = {
      accountId,
      adminId: admin.id,
      level: admin.level,
      schoolId: admin.schoolId,
      email: admin.email,
      name: admin.name,
    };

    const { accessToken, refreshToken, hashedRefreshToken, cookieMaxAge } =
      await this.tokenService.generateAdminTokens(payload);

    const expiresAt = new Date(Date.now() + cookieMaxAge);

    await this.prisma.authSession.upsert({
      where: { deviceId_accountId: { deviceId, accountId } },
      create: {
        deviceId,
        accountId,
        hashedRefreshToken,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        expiresAt,
      },
      update: {
        hashedRefreshToken,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        expiresAt,
        city: meta?.city,
        country: meta?.country,
      },
    });

    return { accessToken, refreshToken, cookieMaxAge, admin: payload };
  }

  // ================= 邀請連結 =================

  /**
   * 建立邀請連結。明文 token 只有這裡回傳一次，DB 只存 hash。
   * 回傳的 token 由 controller 自己組成完整連結（前端網域由前端決定，後端不寫死）。
   */
  async createInvite(
    invitedByAdminId: string,
    email: string,
    level: AdminLevel,
    schoolId: string | null,
  ) {
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      throw new AppError(
        'ADMIN_EXISTS',
        'An admin with this email already exists.',
        409,
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRES_IN_MS);

    await this.prisma.adminInvite.create({
      data: {
        email,
        level,
        schoolId,
        tokenHash,
        invitedByAdminId,
        expiresAt,
      },
    });

    return { token, email, level, schoolId, expiresAt };
  }

  /** 邀請連結被打開時用來顯示「你被邀請成為 XX admin」的資訊，不需要登入即可查 */
  async getInvite(token: string): Promise<AdminInviteInfo> {
    const invite = await this.findValidInvite(token);
    return {
      email: invite.email,
      level: invite.level,
      schoolId: invite.schoolId,
    };
  }

  /** 接受邀請：建立 Admin + Account，並直接發 token 讓對方自動登入 */
  async acceptInvite(
    token: string,
    name: string,
    password: string,
    deviceId: string,
    meta?: AdminAuthMeta,
  ) {
    if (!deviceId) {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is required.');
    }

    const invite = await this.findValidInvite(token);

    // salt 必須在建立 Admin 前就先產生，因為密碼要用它來 hash
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(password, salt);

    const { admin, account } = await this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          name,
          email: invite.email,
          level: invite.level,
          schoolId: invite.schoolId,
          salt,
        },
      });

      const account = await tx.account.create({
        data: {
          adminId: admin.id,
          role: 'ADMIN',
          provider: 'credentials',
          providerAccountId: invite.email,
          password: hashedPassword,
        },
      });

      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { admin, account };
    });

    // 新帳號剛建立，讓所有 process 的快取立刻知道這是一個 admin
    await this.adminService.invalidateAccount(account.id);

    return this.issueSession(account.id, admin, deviceId, meta);
  }

  private async findValidInvite(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const invite = await this.prisma.adminInvite.findUnique({
      where: { tokenHash },
    });

    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new AppError(
        'INVITE_INVALID',
        'This invite link is invalid or has expired.',
        400,
      );
    }

    return invite;
  }
}
