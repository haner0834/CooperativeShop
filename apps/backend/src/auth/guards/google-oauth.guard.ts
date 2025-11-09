// src/auth/guards/google-oauth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestError } from 'src/types/error.types';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { schoolId, deviceId } = request.query;

    // 在這裡驗證必要參數
    if (!schoolId || typeof schoolId !== 'string') {
      throw new BadRequestError('MISSING_SCHOOL_ID', 'School ID is required.');
    }

    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is required.');
    }

    // 構建 state 並將其作為選項返回
    // Passport 會自動將這個 state 附加到導向 Google 的 URL 中
    const state = Buffer.from(JSON.stringify({ schoolId, deviceId })).toString(
      'base64',
    );

    return { state };
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // 在 NestJS 中，可以拋出自定義異常
      throw err || new Error(info?.message || 'Authentication failed');
    }
    return user;
  }
}
