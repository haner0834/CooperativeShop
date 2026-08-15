// src/auth/strategies/google-admin.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AdminAuthService } from '../services/admin-auth.service';
import { BadRequestError } from 'src/types/error.types';
import { env } from 'src/common/utils/env.utils';
import { AdminGoogleOAuthState } from '../types/admin-auth.types';

/**
 * Admin 專用的 Google 策略，跟學生端的 GoogleStrategy 完全分開
 * （不同 passport strategy 名稱 'google-admin'、不同 callback URL）。
 *
 * 這裡直接呼叫 AdminAuthService.completeGoogleAuth 把「登入 or 驗證邀請並建帳號」
 * 的判斷都收斂在 service 裡，strategy 只負責把 Google 回傳的資料整理乾淨。
 */
@Injectable()
export class GoogleAdminStrategy extends PassportStrategy(
  Strategy,
  'google-admin',
) {
  constructor(private readonly adminAuthService: AdminAuthService) {
    const clientID = env('GOOGLE_CLIENT_ID');
    const clientSecret = env('GOOGLE_CLIENT_SECRET');
    const callbackURL = env('GOOGLE_ADMIN_CALLBACK_URL');

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      passReqToCallback: true,
      // @ts-ignore
      prompt: 'select_account',
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const stateJSON = Buffer.from(
        req.query.state as string,
        'base64',
      ).toString('ascii');
      const state: AdminGoogleOAuthState = JSON.parse(stateJSON);

      if (!state.deviceId) {
        throw new BadRequestError(
          'MISSING_DEVICE_ID',
          'Device ID is missing from state.',
        );
      }

      if (!profile.emails || profile.emails.length === 0) {
        throw new BadRequestError(
          'EMAIL_NOT_FOUND',
          'No email found in Google profile.',
        );
      }

      const googleProfile = {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      };

      // 邀請 token 是否有效、email 是否對得上邀請信、既有 admin 是否存在，
      // 全部都在 service 裡驗證；不通過會直接 throw，
      // 交給 GoogleAdminRedirectGuard 導去失敗頁，不會建立任何帳號。
      const session = await this.adminAuthService.completeGoogleAuth(
        state.inviteToken ?? undefined,
        googleProfile,
        state.deviceId,
        { ip: req.ip, userAgent: req.headers?.['user-agent'] },
      );

      // to 純粹透傳給 controller 決定登入成功後要導去哪，這裡不做任何驗證
      // （避免這個 strategy 對 URL 格式有意見，交給前端/controller 處理即可）
      done(null, { ...session, to: state.to });
    } catch (error) {
      done(error, undefined);
    }
  }
}
