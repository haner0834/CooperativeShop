// src/auth/admin-auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import express from 'express';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminService } from '../services/admin.service';
import {
  AdminAuthMeta,
  AdminGoogleAuthResult,
} from '../types/admin-auth.types';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { JwtAdminRefreshGuard } from '../guards/jwt-admin-refresh.guard';
import { GoogleAdminOAuthGuard } from '../guards/google-admin-oauth.guard';
import { GoogleAdminRedirectGuard } from '../guards/google-admin-redirect.guard';
import { CurrentAdmin } from 'src/common/decorators/current-admin.decorator';
import { type AdminContext } from '../types/admin-context.types';
import { CreateAdminInviteDto } from '../dto/admin-auth.dto';
import { BadRequestError, UnauthorizedError } from 'src/types/error.types';
import { RateLimit } from 'src/rate-limit/rate-limit.decorator';
import { DeviceId } from 'src/device-id/device-id.decorator';
import { type DeviceIdResult } from 'src/device-id/types/device-id-result';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { env } from 'src/common/utils/env.utils';

// 刻意跟學生端的 cookie 分開：不同名字 + 不同 path，
// 避免同網域下兩份 refresh token cookie 互相覆蓋或送錯 endpoint。
const adminHttpOnlyCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/api/auth/admin',
} as const;

@Controller('auth/admin')
@RateLimit({ uid: 20, did: 20, global: 100, isolateScope: 'auth:admin' })
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly adminService: AdminService,
  ) {}

  private setAdminRefreshCookie(
    res: express.Response,
    refreshToken: string,
    cookieMaxAge: number,
  ) {
    res.cookie('adminRefreshToken', refreshToken, {
      ...adminHttpOnlyCookieOptions,
      maxAge: cookieMaxAge,
    });
  }

  private getDeviceId(deviceIdResult: DeviceIdResult): string {
    const deviceId = deviceIdResult?.value ?? null;
    if (!deviceId) {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Missing device id');
    }
    return deviceId;
  }

  // ================= Google OAuth 登入 =================
  //
  // 登入（包含邀請連結接受後的第一次登入）一律走 Google OAuth，不再支援密碼登入。
  //
  // 前端流程：
  // 1. 一般登入：導去 `GET /auth/admin/google?deviceId=xxx`
  // 2. 打開邀請連結：先呼叫 `GET /auth/admin/invites/:token` 顯示「你被邀請成為 XX admin」，
  //    再導去 `GET /auth/admin/google?deviceId=xxx&inviteToken=xxx`
  // 3. Google 驗證完在 callback 決定要「登入既有帳號」還是「驗證邀請 email 後建立新帳號」，
  //    只設 refresh cookie 就導回前端，accessToken 不會出現在 URL 上；
  //    前端落地後打既有的 `POST /auth/admin/restore` 換一次 accessToken。

  @Get('google')
  @UseGuards(GoogleAdminOAuthGuard)
  @RateLimit({
    uid: 20,
    did: 20,
    global: 100,
    isolateScope: 'auth:admin-google',
  })
  googleAuth() {
    // 實際導轉由 GoogleAdminOAuthGuard 處理，這裡不會被執行到
  }

  @Get('google/callback')
  @UseGuards(GoogleAdminRedirectGuard)
  @RateLimit({
    uid: 20,
    did: 20,
    global: 100,
    isolateScope: 'auth:admin-google',
  })
  async googleAuthCallback(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    // 驗證失敗（token 無效/過期、邀請 email 對不上、Google 帳號不是既有 admin）
    // 都已經在 GoogleAdminRedirectGuard 導去失敗頁了，能執行到這裡代表通過驗證。
    const result = req.user as AdminGoogleAuthResult;

    this.setAdminRefreshCookie(res, result.refreshToken, result.cookieMaxAge);

    const redirectUrl = new URL(`${env('ADMIN_CONSOLE_URL')}/oauth-callback`);
    if (result.to) redirectUrl.searchParams.set('to', result.to);

    return res.redirect(redirectUrl.toString());
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    uid: 30,
    did: 30,
    global: 150,
    isolateScope: 'auth:admin-refresh',
  })
  async refresh(
    @Req() req: express.Request,
    @DeviceId() deviceIdResult: DeviceIdResult,
    @Res({ passthrough: true }) res: express.Response,
    @Headers('user-agent') userAgent: string,
  ) {
    const deviceId = this.getDeviceId(deviceIdResult);
    const refreshToken = req.cookies?.adminRefreshToken;
    const meta: AdminAuthMeta = { ip: req.ip, userAgent };

    const result = await this.adminAuthService.adminRotateRefreshToken(
      refreshToken,
      deviceId,
      meta,
    );

    this.setAdminRefreshCookie(res, result.refreshToken, result.cookieMaxAge);

    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    uid: 30,
    did: 30,
    global: 150,
    isolateScope: 'auth:admin-restore',
  })
  async restore(
    @Req() req: express.Request,
    @DeviceId() deviceIdResult: DeviceIdResult,
    @Res({ passthrough: true }) res: express.Response,
    @Headers('user-agent') userAgent: string,
  ) {
    const deviceId = this.getDeviceId(deviceIdResult);
    const refreshToken = req.cookies?.adminRefreshToken;
    const meta: AdminAuthMeta = { ip: req.ip, userAgent };

    const result = await this.adminAuthService.adminRestoreSession(
      refreshToken,
      deviceId,
      meta,
    );

    this.setAdminRefreshCookie(res, result.refreshToken, result.cookieMaxAge);

    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Post('logout')
  @UseGuards(JwtAdminRefreshGuard)
  @RateLimit({ uid: 5, did: 5, global: 20, isolateScope: 'auth:admin-logout' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: express.Request,
    @DeviceId() deviceIdResult: DeviceIdResult,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const deviceId = this.getDeviceId(deviceIdResult);
    const refreshToken = req.cookies?.adminRefreshToken;
    if (!refreshToken) throw new UnauthorizedError();

    await this.adminAuthService.adminLogout(refreshToken, deviceId);

    res.cookie('adminRefreshToken', '', {
      ...adminHttpOnlyCookieOptions,
      maxAge: 0,
    });

    return { message: 'Logged out successfully.' };
  }

  // ================= 邀請連結 =================

  @Post('invites')
  @AdminOnly()
  @RateLimit({
    uid: 20,
    did: 0,
    global: 100,
    isolateScope: 'auth:admin-invite',
  })
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Body() dto: CreateAdminInviteDto,
    @CurrentAdmin() admin: AdminContext,
  ) {
    // 現階段只做 org level admin console，先擋掉 SCHOOL 邀請，
    // 開放 school admin 時把這個檢查拿掉即可
    if (dto.level !== 'ORGANIZATION') {
      throw new BadRequestError(
        'UNSUPPORTED_ADMIN_LEVEL',
        'Only ORGANIZATION level invites are supported right now.',
      );
    }

    const invite = await this.adminAuthService.createInvite(
      admin.adminId,
      dto.email,
      dto.level,
      dto.schoolId ?? null,
    );

    // 前端自己組連結，例如
    // `${ADMIN_CONSOLE_URL}/invite/${token}`，打開後再導去
    // `GET /auth/admin/google?deviceId=xxx&inviteToken=${token}`
    return invite;
  }

  // ================= 成員管理 =================

  @Get('members')
  @AdminOnly()
  @RateLimit({
    uid: 30,
    did: 0,
    global: 150,
    isolateScope: 'auth:admin-members',
  })
  async listMembers() {
    return this.adminService.listAdmins();
  }

  @Post('members/:adminId/deactivate')
  @AdminOnly()
  @RateLimit({
    uid: 20,
    did: 0,
    global: 100,
    isolateScope: 'auth:admin-members',
  })
  @HttpCode(HttpStatus.OK)
  async deactivateMember(
    @Param('adminId') adminId: string,
    @CurrentAdmin() admin: AdminContext,
  ) {
    // 用 adminId 比對「自己」，不是 accountId——一個 admin 可能同時有
    // credentials + google 兩個 accountId，比 accountId 會誤判成不是自己
    if (adminId === admin.adminId) {
      throw new BadRequestError(
        'CANNOT_DEACTIVATE_SELF',
        'You cannot deactivate your own account.',
      );
    }
    await this.adminService.deactivateAdmin(adminId);
    return { message: 'Admin deactivated.' };
  }

  @Post('members/:adminId/reactivate')
  @AdminOnly()
  @RateLimit({
    uid: 20,
    did: 0,
    global: 100,
    isolateScope: 'auth:admin-members',
  })
  @HttpCode(HttpStatus.OK)
  async reactivateMember(@Param('adminId') adminId: string) {
    await this.adminService.reactivateAdmin(adminId);
    return { message: 'Admin reactivated.' };
  }

  // ================= 邀請連結 =================

  @Get('invites')
  @AdminOnly()
  @RateLimit({
    uid: 30,
    did: 0,
    global: 150,
    isolateScope: 'auth:admin-invite',
  })
  async listInvites() {
    return this.adminAuthService.listPendingInvites();
  }

  @Post('invites/:id/revoke')
  @AdminOnly()
  @RateLimit({
    uid: 20,
    did: 0,
    global: 100,
    isolateScope: 'auth:admin-invite',
  })
  @HttpCode(HttpStatus.OK)
  async revokeInvite(@Param('id') id: string) {
    await this.adminAuthService.revokeInvite(id);
    return { message: 'Invite revoked.' };
  }

  @Get('invites/:token')
  @RateLimit({
    uid: 30,
    did: 30,
    global: 150,
    isolateScope: 'auth:admin-invite',
  })
  async getInvite(@Param('token') token: string) {
    // 給前端顯示「你被邀請成為 XX admin，用 Google 登入以繼續」的頁面用，
    // 不需要登入即可查；真正驗證 token + email 是否相符在 /google/callback 才做。
    return this.adminAuthService.getInvite(token);
  }
}
