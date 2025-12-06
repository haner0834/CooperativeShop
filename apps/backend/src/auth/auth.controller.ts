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
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
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
import { Throttle } from '@nestjs/throttler';
import { GoogleRedirectGuard } from './guards/google-redirect.guard';

const httpOnlyCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/api/auth',
} as const;

@Throttle({ default: { ttl: 1 * 60 * 1000, limit: 20 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async handleAuthSuccess(res: express.Response, user: User, deviceId: string) {
    const { cookieMaxAge, ...data } = await this.authService.authSuccess(
      user,
      deviceId,
    );
    res.cookie('refreshToken', data.refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: cookieMaxAge,
    });
    return data;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.authService.registerWithStudentId(registerDto);
    const data = await this.handleAuthSuccess(res, user, deviceId);

    return data;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.authService.loginWithStudentId(loginDto);
    const data = await this.handleAuthSuccess(res, user, deviceId);

    return data;
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
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
  @Throttle({ default: { ttl: 1 * 60 * 1000, limit: 100 } })
  async refreshToken(
    @Req() req: express.Request,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    const result = await this.authService.rotateRefreshToken(
      refreshToken,
      deviceId,
    );

    res.cookie('refreshToken', result.refreshToken, {
      ...httpOnlyCookieOptions,
      maxAge: result.cookieMaxAge,
    });

    return { accessToken: result.accessToken };
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 1 * 60 * 1000, limit: 100 } })
  async restoreSession(
    @Req() req: express.Request,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!deviceId)
      throw new BadRequestError('MISSING_DEVICE_ID', 'Missing device ID');

    const user = await this.authService.restoreSession(refreshToken, deviceId);

    if (user) {
      const data = this.handleAuthSuccess(res, user, deviceId);
      return data;
    }
  }

  @Post('switch-account')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async switchAccount(
    @Body() switchAccountDto: SwitchAccountDto,
    @Headers('x-device-id') deviceId: string,
    @Res({ passthrough: true }) res: express.Response,
    @CurrentUser() currentUser: UserPayload,
  ) {
    const result = await this.authService.switchAccount(
      switchAccountDto.targetUserId,
      deviceId,
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
  @UseGuards(GoogleRedirectGuard)
  async googleCallback(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const user = req.user as any;
    const deviceId = user.deviceId;
    const to = user.to;
    console.log('to:', to);
    let redirectUrl = '';
    if (to && to != 'null') {
      redirectUrl = env('FRONTEND_URL_ROOT', '') + decodeURIComponent(to);
    }

    await this.handleAuthSuccess(res, user, deviceId);

    // 重定向到前端
    const frontendUrl = env('FRONTEND_URL', '/home');

    return res.redirect(redirectUrl ? redirectUrl : frontendUrl);
  }
}
