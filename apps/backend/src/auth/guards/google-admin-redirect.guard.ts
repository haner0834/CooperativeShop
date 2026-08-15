// src/auth/guards/google-admin-redirect.guard.ts
import { AuthGuard } from '@nestjs/passport';
import { env } from 'src/common/utils/env.utils';
import { Injectable } from '@nestjs/common';

/**
 * 處理 `GET /auth/admin/google/callback`。
 *
 * 失敗（包含 GoogleAdminStrategy 裡拋出的 INVITE_EMAIL_MISMATCH / ADMIN_NOT_FOUND /
 * INVITE_INVALID 等）一律導回 admin console 的失敗頁，不讓任何未通過驗證的請求
 * 進到 controller —— 這就是「登入連結不符就不給進入」的把關點。
 */
@Injectable()
export class GoogleAdminRedirectGuard extends AuthGuard('google-admin') {
  handleRequest(err, user, info, context) {
    const res = context.switchToHttp().getResponse();

    if (err || !user) {
      const message = encodeURIComponent(
        err?.message || info?.message || 'Login failed',
      );
      const code = encodeURIComponent(err?.code || 'OAUTH_ERROR');
      return res.redirect(
        `${env('ADMIN_CONSOLE_URL', '')}/login-failed?code=${code}&message=${message}`,
      );
    }

    return user;
  }
}
