// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Headers,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import express from 'express';
import { AuthMeta, AuthService } from './services/auth.service';
import { Log } from 'src/common/decorators/logger.decorator';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  SwitchAccountDto,
  GoogleLoginQueryDto,
} from './dto/auth.dto';
import type { UserPayload } from './types/auth.types';
import type { User } from '@prisma/client';
import { BadRequestError, UnauthorizedError } from 'src/types/error.types';
import { AuthGuard } from '@nestjs/passport';
import { env } from 'src/common/utils/env.utils';
import { GoogleRedirectGuard } from './guards/google-redirect.guard';
import { RateLimit } from 'src/rate-limit/rate-limit.decorator';

const httpOnlyCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/api/auth',
} as const;

@Controller('auth')
@RateLimit({ uid: 20, did: 20, global: 150, isolateScope: 'auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async handleAuthSuccess(
    res: express.Response,
    user: User,
    deviceId: string,
    meta: AuthMeta,
  ) {
    const { cookieMaxAge, ...data } = await this.authService.authSuccess(
      user,
      deviceId,
      meta,
    );
    res.cookie('refreshToken', data.refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: cookieMaxAge,
    });
    return data;
  }

  @Post('register')
  @RateLimit({ uid: 5, did: 5, global: 100, isolateScope: 'auth:register' })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: any, // NOTE: Use express.d.ts to tell compiler, rather than this shi
    @Headers('user-agent') userAgent: string,
  ) {
    const user = await this.authService.registerWithStudentId(registerDto);
    const meta: AuthMeta = {
      ...req.cf,
      ip: req.ip,
      userAgent: userAgent,
    };
    const data = await this.handleAuthSuccess(res, user, deviceId, meta);

    return data;
  }

  @Post('login')
  @RateLimit({ uid: 5, did: 5, global: 100, isolateScope: 'auth:login' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: any, // NOTE: Use express.d.ts to tell compiler, rather than this shi
    @Headers('user-agent') userAgent: string,
  ) {
    const user = await this.authService.loginWithStudentId(loginDto);
    const meta: AuthMeta = {
      ...req.cf,
      ip: req.ip,
      userAgent: userAgent,
    };
    const data = await this.handleAuthSuccess(res, user, deviceId, meta);

    return data;
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @RateLimit({ uid: 5, did: 0, global: 20, isolateScope: 'auth:logout' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: express.Request,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @CurrentUser() user: UserPayload,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedError();

    await this.authService.logout(refreshToken, deviceId);

    res.cookie('refreshToken', '', {
      ...httpOnlyCookieOptions,
      maxAge: 0,
    });

    return { message: 'Logged out successfully.' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ uid: 30, did: 30, global: 200, isolateScope: 'auth:refresh' })
  async refreshToken(
    @Req() req: express.Request,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const ipAddress = req.ip;

    const result = await this.authService.rotateRefreshToken(
      refreshToken,
      deviceId,
      ipAddress,
    );

    res.cookie('refreshToken', result.refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: result.cookieMaxAge,
    });

    return { accessToken: result.accessToken };
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ uid: 30, did: 30, global: 200, isolateScope: 'auth:restore' })
  @Log({ prefix: 'AuthController.restoreSession', logReturn: false })
  async restoreSession(
    @Req() req: express.Request,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @Headers('user-agent') userAgent: string,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!deviceId)
      throw new BadRequestError('MISSING_DEVICE_ID', 'Missing device ID');

    const user = await this.authService.restoreSession(refreshToken, deviceId);

    if (user) {
      const meta: AuthMeta = {
        ...(req as any).cf,
        ip: req.ip,
        userAgent: userAgent,
      };
      const data = this.handleAuthSuccess(res, user, deviceId, meta);
      return data;
    }
  }

  @Post('switch-account')
  @UseGuards(JwtAccessGuard)
  @RateLimit({ uid: 15, did: 0, global: 100, isolateScope: 'auth:switch-acc' })
  @HttpCode(HttpStatus.OK)
  async switchAccount(
    @Req() req: express.Request,
    @Body() switchAccountDto: SwitchAccountDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const ipAddress = req.ip;
    const result = await this.authService.switchAccount(
      switchAccountDto.targetUserId,
      deviceId,
      ipAddress,
    );

    res.cookie('refreshToken', result.refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: result.cookieMaxAge,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin(
    @Query() query: GoogleLoginQueryDto,
    @Res() res: express.Response,
  ) {
    // Guard 會處理重定向到 Google
    // 這個方法實際上不會被執行，但需要存在
  }

  @Get('google/callback')
  @RateLimit({
    uid: 10,
    did: 10,
    global: 80,
    isolateScope: 'auth:ggl-callback',
  })
  @UseGuards(GoogleRedirectGuard)
  async googleCallback(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Headers('user-agent') userAgent: string,
  ) {
    const user = req.user as any;
    const deviceId = user.deviceId;
    const to = user.to;
    let redirectUrl = '';
    if (to && to != 'null') {
      redirectUrl = env('FRONTEND_URL_ROOT', '') + decodeURIComponent(to);
    }

    const meta: AuthMeta = {
      ...(req as any).cf,
      ip: req.ip,
      userAgent: userAgent,
    };
    await this.handleAuthSuccess(res, user, deviceId, meta);

    // 重定向到前端
    const frontendUrl = env('FRONTEND_URL', '/shops');

    return res.redirect(redirectUrl ? redirectUrl : frontendUrl);
  }
}
