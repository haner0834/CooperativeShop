// src/auth/services/admin-auth.service.ts
import { Injectable } from '@nestjs/common';
import { Admin, AdminLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';
import { AdminService } from './admin.service';
import {
  AdminAuthMeta,
  AdminGoogleProfile,
  AdminInviteInfo,
  AdminPayload,
  AdminSession,
  PendingInvite,
} from '../types/admin-auth.types';
import {
  AppError,
  AuthError,
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

  // ================= Google OAuth 登入 / 邀請驗證 =================

  /**
   * GoogleAdminStrategy 驗證完 Google 身分後呼叫的統一入口。
   *
   * - 有帶 inviteToken：代表使用者是打開邀請連結後才走 Google 登入，
   *   必須 token 有效「且」Google email 跟邀請信上的 email 完全相符，
   *   驗證通過才會建立 Admin + Account；任何一項不符都直接拒絕、不建帳號。
   * - 沒帶 inviteToken：代表是既有 admin 的日常登入，純粹用 googleId
   *   去比對「已經存在」的 Account，找不到就直接拒絕——不會讓任何
   *   Google 帳號自動變成 admin，帳號只能透過邀請流程建立。
   */
  async completeGoogleAuth(
    inviteToken: string | undefined,
    profile: AdminGoogleProfile,
    deviceId: string,
    meta?: AdminAuthMeta,
  ): Promise<AdminSession> {
    if (!deviceId) {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is required.');
    }

    if (inviteToken) {
      return this.acceptInviteWithGoogle(inviteToken, profile, deviceId, meta);
    }

    return this.googleLogin(profile, deviceId, meta);
  }

  private async googleLogin(
    profile: AdminGoogleProfile,
    deviceId: string,
    meta?: AdminAuthMeta,
  ): Promise<AdminSession> {
    const account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.googleId,
        },
      },
      include: { admin: true },
    });

    if (
      !account ||
      account.role !== 'ADMIN' ||
      !account.admin ||
      !account.admin.isActive
    ) {
      // 刻意統一用同一個錯誤，不透露「這個 Google 帳號存在但不是 admin」
      // 還是「這個 Google 帳號從沒登入過」，避免帳號列舉
      throw new AuthError(
        'ADMIN_NOT_FOUND',
        'This Google account is not registered as an admin.',
        401,
      );
    }

    await this.prisma.admin.update({
      where: { id: account.admin.id },
      data: { lastLoginAt: new Date(), lastLoginIp: meta?.ip },
    });

    return this.issueSession(account.id, account.admin, deviceId, meta);
  }

  private async acceptInviteWithGoogle(
    token: string,
    profile: AdminGoogleProfile,
    deviceId: string,
    meta?: AdminAuthMeta,
  ): Promise<AdminSession> {
    const invite = await this.findValidInvite(token);

    // 核心規則：邀請連結指定的 email 必須跟 Google 登入拿到的 email 完全對上，
    // 對不上就直接擋掉，不建立/連結任何帳號，邀請也維持未使用狀態可以再試一次
    if (invite.email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new AuthError(
        'INVITE_EMAIL_MISMATCH',
        'This Google account does not match the invited email.',
        401,
      );
    }

    // Admin.account 是 Account[]，一個 admin 底下可以同時有多種登入方式。
    // 如果這個 email 已經對應到一個既有 admin，代表這次邀請的目的是
    // 「幫既有 admin 補上 Google 登入」，而不是建立新 admin——
    // 這樣既有的 credentials 登入方式（如果還留著）也不會被動到。
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email: invite.email },
    });

    const { admin, account } = existingAdmin
      ? await this.linkGoogleAccount(existingAdmin, profile, invite.id)
      : await this.createAdminWithGoogle(invite, profile);

    // 不管是新建還是連結，都用 invalidateAdmin 讓這個 admin 名下「所有」
    // Account 的 cache 一起刷新，避免只刷新到剛異動的那一筆
    await this.adminService.invalidateAdmin(admin.id);

    return this.issueSession(account.id, admin, deviceId, meta);
  }

  /** 幫既有 admin 多開一筆 Google 登入方式，不建立新 Admin、不動原本的登入方式 */
  private async linkGoogleAccount(
    existingAdmin: Admin,
    profile: AdminGoogleProfile,
    inviteId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 防呆：避免重複連結（例如使用者重整頁面重送、或極端 race condition）
      const alreadyLinked = await tx.account.findFirst({
        where: { adminId: existingAdmin.id, provider: 'google' },
      });
      if (alreadyLinked) {
        throw new AppError(
          'ALREADY_LINKED',
          'This admin already has a Google account linked.',
          409,
        );
      }

      const account = await tx.account.create({
        data: {
          adminId: existingAdmin.id,
          role: 'ADMIN',
          provider: 'google',
          providerAccountId: profile.googleId,
        },
      });

      await tx.adminInvite.update({
        where: { id: inviteId },
        data: { acceptedAt: new Date() },
      });

      return { admin: existingAdmin, account };
    });
  }

  /** 邀請信對應的 email 還沒有任何 admin，走全新建立流程 */
  private async createAdminWithGoogle(
    invite: {
      id: string;
      email: string;
      level: AdminLevel;
      schoolId: string | null;
    },
    profile: AdminGoogleProfile,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          name: profile.name,
          email: invite.email,
          level: invite.level,
          schoolId: invite.schoolId,
        },
      });

      const account = await tx.account.create({
        data: {
          adminId: admin.id,
          role: 'ADMIN',
          provider: 'google',
          providerAccountId: profile.googleId,
        },
      });

      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { admin, account };
    });
  }

  // ================= Session（refresh / restore / logout） =================

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
  ): Promise<AdminSession> {
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
    // Admin.accounts 是 Account[]，一個 admin 可以同時掛多種登入方式。
    // 所以「這個 email 已經有 admin 了」不再直接擋掉——
    // 如果那個既有 admin 還沒有 google 登入方式，這張邀請的用途就是
    // 「幫他補上 Google 登入」（見 acceptInviteWithGoogle），要放行；
    // 只有「email 已存在，而且 google 也已經連過了」才真的擋掉。
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email },
      include: { accounts: { select: { provider: true } } },
    });

    if (existingAdmin) {
      const alreadyHasGoogle = existingAdmin.accounts.some(
        (a) => a.provider === 'google',
      );
      if (alreadyHasGoogle) {
        throw new AppError(
          'ADMIN_EXISTS',
          'An admin with this email already exists.',
          409,
        );
      }
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

  /** 給 admin console 顯示還沒被接受、也還沒過期的邀請連結列表 */
  async listPendingInvites(): Promise<PendingInvite[]> {
    const invites = await this.prisma.adminInvite.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        email: true,
        level: true,
        schoolId: true,
        expiresAt: true,
        createAt: true,
        invitedBy: { select: { name: true } },
      },
      orderBy: { createAt: 'desc' },
    });

    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      level: i.level,
      schoolId: i.schoolId,
      expiresAt: i.expiresAt,
      createAt: i.createAt,
      invitedByName: i.invitedBy.name,
    }));
  }

  /** 撤銷一個還沒被接受的邀請連結，讓連結直接失效 */
  async revokeInvite(id: string): Promise<void> {
    const invite = await this.prisma.adminInvite.findUnique({
      where: { id },
      select: { acceptedAt: true },
    });

    if (!invite) return; // 已經不存在，視為成功
    if (invite.acceptedAt) {
      throw new AppError(
        'INVITE_ALREADY_ACCEPTED',
        'This invite has already been accepted and cannot be revoked.',
        409,
      );
    }

    await this.prisma.adminInvite.delete({ where: { id } });
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
