// src/auth/guards/google-admin-oauth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestError } from 'src/types/error.types';
import { AdminGoogleOAuthState } from '../types/admin-auth.types';

/**
 * 觸發 admin 的 Google OAuth（`GET /auth/admin/google`）。
 *
 * - deviceId 一定要有（跟學生端 GoogleOAuthGuard 的規則一致，走 query 帶）。
 * - inviteToken 是選填：有帶代表「打開邀請連結後用 Google 登入」，
 *   沒帶就是既有 admin 的一般登入。兩種情況共用同一組 Google callback，
 *   實際判斷邏輯都在 GoogleAdminStrategy / AdminAuthService.completeGoogleAuth。
 */
@Injectable()
export class GoogleAdminOAuthGuard extends AuthGuard('google-admin') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { deviceId, inviteToken, to } = request.query;

    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestError('MISSING_DEVICE_ID', 'Device ID is required.');
    }

    if (inviteToken !== undefined && typeof inviteToken !== 'string') {
      throw new BadRequestError(
        'INVALID_INVITE_TOKEN',
        'Invite token is not valid.',
      );
    }

    if (to !== undefined && typeof to !== 'string') {
      throw new BadRequestError(
        'INCORRECT_REDIRECT_PATH',
        'Redirect path is not valid.',
      );
    }

    const state: AdminGoogleOAuthState = {
      deviceId,
      inviteToken: (inviteToken as string) ?? null,
      to: (to as string) ?? null,
    };

    return {
      state: Buffer.from(JSON.stringify(state)).toString('base64'),
      prompt: 'select_account',
    };
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new Error(info?.message || 'Authentication failed');
    }
    return user;
  }
}
