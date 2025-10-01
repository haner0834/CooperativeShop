// src/auth/guards/google-oauth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestError } from 'src/types/error.types';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { schoolId, deviceId } = request.query;

    // 在進入 passport 之前先驗證必要參數
    if (!schoolId || typeof schoolId !== 'string') {
      throw new BadRequestError('School ID is required.');
    }

    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestError('Device ID is required.');
    }

    // 構建 state 並設置到 request 中
    const state = Buffer.from(JSON.stringify({ schoolId, deviceId })).toString(
      'base64',
    );

    // 將 state 添加到 passport 的選項中
    (request as any).authInfo = { state };

    const result = (await super.canActivate(context)) as boolean;
    return result;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // 在 NestJS 中，可以拋出自定義異常
      throw err || new Error(info?.message || 'Authentication failed');
    }
    return user;
  }
}
