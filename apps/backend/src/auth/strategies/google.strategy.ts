// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../services/auth.service';
import { Injectable } from '@nestjs/common';
import { BadRequestError } from 'src/types/error.types';
import { env } from 'src/common/utils/env.utils';

interface State {
  schoolId: string;
  deviceId?: string;
  to?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
    const clientID = env('GOOGLE_CLIENT_ID');
    const clientSecret = env('GOOGLE_CLIENT_SECRET');
    const callbackURL = env('GOOGLE_CALLBACK_URL');

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
      // 解析 state 參數
      const stateJSON = Buffer.from(
        req.query.state as string,
        'base64',
      ).toString('ascii');
      const state: State = JSON.parse(stateJSON);

      if (!state.schoolId) {
        throw new BadRequestError(
          'MISSING_SCHOOL_ID',
          'School ID is missing from state.',
        );
      }

      if (!state.deviceId) {
        throw new BadRequestError(
          'MISSING_SCHOOL_ID',
          'Device ID is missing from state.',
        );
      }

      // 驗證學校
      const school = await this.prisma.school.findUnique({
        where: { id: state.schoolId },
      });

      if (!school) {
        throw new BadRequestError(
          'SCHOOL_NOT_FOUND',
          'Invalid school specified.',
        );
      }

      // 驗證 email
      if (!profile.emails || profile.emails.length === 0) {
        throw new BadRequestError(
          'EMAIL_NOT_FOUND',
          'No email found in Google profile.',
        );
      }

      const googleProfile = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
      };

      // 尋找或創建用戶
      const user = await this.authService.findOrCreateUserByGoogle(
        googleProfile,
        school,
      );

      // 將 deviceId 附加到 user 物件上
      (user as any).deviceId = state.deviceId;
      (user as any).to = state.to;

      return user;
    } catch (error) {
      done(error, undefined);
    }
  }
}
