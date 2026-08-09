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
import { AdminAuthMeta } from '../types/admin-auth.types';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { JwtAdminRefreshGuard } from '../guards/jwt-admin-refresh.guard';
import { CurrentAdmin } from 'src/common/decorators/current-admin.decorator';
import { type AdminContext } from '../types/admin-context.types';
import {
  AdminLoginDto,
  CreateAdminInviteDto,
  AcceptAdminInviteDto,
} from '../dto/admin-auth.dto';
import { BadRequestError, UnauthorizedError } from 'src/types/error.types';
import { RateLimit } from 'src/rate-limit/rate-limit.decorator';
import { DeviceId } from 'src/device-id/device-id.decorator';
import { type DeviceIdResult } from 'src/device-id/types/device-id-result';

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
  constructor(private readonly adminAuthService: AdminAuthService) {}

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

  @Post('login')
  @RateLimit({ uid: 5, did: 5, global: 30, isolateScope: 'auth:admin-login' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AdminLoginDto,
    @DeviceId() deviceIdResult: DeviceIdResult,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
    @Headers('user-agent') userAgent: string,
  ) {
    const deviceId = this.getDeviceId(deviceIdResult);
    const meta: AdminAuthMeta = { ...(req as any).cf, ip: req.ip, userAgent };

    const { accessToken, refreshToken, cookieMaxAge, admin } =
      await this.adminAuthService.adminLogin(
        dto.email,
        dto.password,
        deviceId,
        meta,
      );

    this.setAdminRefreshCookie(res, refreshToken, cookieMaxAge);

    return { accessToken, admin };
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
  @RateLimit({ uid: 5, did: 0, global: 20, isolateScope: 'auth:admin-logout' })
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
  @UseGuards(JwtAdminGuard)
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

    // 前端自己組連結（例如 `${ADMIN_CONSOLE_URL}/invite/${token}`），
    return invite;
  }

  @Get('invites/:token')
  @RateLimit({
    uid: 30,
    did: 30,
    global: 150,
    isolateScope: 'auth:admin-invite',
  })
  async getInvite(@Param('token') token: string) {
    return this.adminAuthService.getInvite(token);
  }

  @Post('invites/:token/accept')
  @RateLimit({ uid: 5, did: 5, global: 30, isolateScope: 'auth:admin-invite' })
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptAdminInviteDto,
    @DeviceId() deviceIdResult: DeviceIdResult,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
    @Headers('user-agent') userAgent: string,
  ) {
    const deviceId = this.getDeviceId(deviceIdResult);
    const meta: AdminAuthMeta = { ip: req.ip, userAgent };

    const { accessToken, refreshToken, cookieMaxAge, admin } =
      await this.adminAuthService.acceptInvite(
        token,
        dto.name,
        dto.password,
        deviceId,
        meta,
      );

    this.setAdminRefreshCookie(res, refreshToken, cookieMaxAge);

    return { accessToken, admin };
  }
}
