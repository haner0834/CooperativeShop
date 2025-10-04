// src/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import ms from 'ms';
import {
  UserPayload,
  Tokens,
  GeneratedRefreshToken,
} from '../types/auth.types';
import { env } from 'src/common/utils/env.utils';

@Injectable()
export class TokenService {
  private readonly SALT_ROUNDS = 10;
  private readonly JWT_ACCESS_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_ACCESS_EXPIRES_IN: ms.StringValue = '15m';
  private readonly JWT_REFRESH_EXPIRES_IN: ms.StringValue = '30d';

  constructor(private jwtService: JwtService) {
    this.JWT_ACCESS_SECRET = env('JWT_ACCESS_SECRET');
    this.JWT_REFRESH_SECRET = env('JWT_REFRESH_SECRET');
  }

  getRefreshTokenMaxAge(trustDevice: boolean): number {
    return (trustDevice ? 7 : 30) * 24 * 60 * 60 * 1000;
  }

  generateAccessToken(payload: UserPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.JWT_ACCESS_SECRET,
      expiresIn: this.JWT_ACCESS_EXPIRES_IN,
      subject: payload.id,
    });
  }

  async generateRefreshToken(
    studentId: string,
  ): Promise<GeneratedRefreshToken> {
    const payload = { jti: crypto.randomBytes(16).toString('hex') };

    // Refresh Token 的過期時間改為固定，例如 30 天
    const token = this.jwtService.sign(payload, {
      secret: this.JWT_REFRESH_SECRET,
      subject: studentId,
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });

    const hash = await bcrypt.hash(token, this.SALT_ROUNDS);

    return { token, hash };
  }

  async generateTokens(payload: UserPayload): Promise<Tokens> {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.JWT_ACCESS_SECRET,
      expiresIn: this.JWT_ACCESS_EXPIRES_IN,
    });

    const { token: refreshToken, hash: hashedRefreshToken } =
      await this.generateRefreshToken(payload.id);

    return {
      accessToken,
      refreshToken,
      hashedRefreshToken, // 我們需要這個來存入資料庫
      cookieMaxAge: ms('30d'), // Cookie 過期時間與 Token 一致
    };
  }

  verifyAccessToken(token: string): UserPayload | null {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.JWT_ACCESS_SECRET,
      });

      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'id' in decoded &&
        'name' in decoded
      ) {
        return decoded as UserPayload;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): any | null {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.JWT_REFRESH_SECRET,
      });

      return typeof decoded === 'object' ? decoded : null;
    } catch (error) {
      return null;
    }
  }
}
