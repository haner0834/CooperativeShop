import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService, TrustLevel } from './rate-limit.service';
import { TooManyRequestsError } from 'src/types/error.types';
import { RateLimitOptions, RATE_LIMIT_KEY } from './rate-limit.decorator';
import { TokenService } from 'src/auth/services/token.service';
import { DeviceIdService } from 'src/device-id/device-id.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly deviceIdService: DeviceIdService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 1. 識別 User
    let userId: string | null = null;
    if (request.user?.id) {
      userId = request.user.id;
    } else {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = this.tokenService.verifyAccessToken(token);
          request.user = decoded;
          userId = decoded?.id || null;
        } catch (e) {
          /* Token invalid, treat as guest */
        }
      }
    }

    // 2. 識別 Device
    let deviceId: string | null = null;
    let trustLevel = TrustLevel.UNTRUSTED;
    let shouldSetCookie = false;

    // A. 嘗試從 Cookie 讀取 (Highest Trust for Device)
    // 需安裝 cookie-parser middleware 才能用 request.cookies
    const signedCookie = request.cookies?.['d_id'];
    if (signedCookie) {
      const verifiedId = this.deviceIdService.verifyDeviceId(signedCookie);
      if (verifiedId) {
        deviceId = verifiedId;
        trustLevel = TrustLevel.DEVICE_COOKIE;
      }
    }

    // B. 如果 Cookie 無效，嘗試讀取 Header
    if (!deviceId) {
      const headerDeviceId = request.headers['x-device-id'];
      if (headerDeviceId && typeof headerDeviceId === 'string') {
        deviceId = headerDeviceId;
        trustLevel = TrustLevel.DEVICE_HEADER;
        // 標記需要下發 Cookie
        shouldSetCookie = true;
      }
    }

    // C. 如果有登入，覆蓋 Trust Level
    if (userId) {
      trustLevel = TrustLevel.AUTHENTICATED;
    }

    // D. 如果完全沒 ID，視為 Bot / Suspicious
    if (!userId && !deviceId) {
      trustLevel = TrustLevel.UNTRUSTED;
    }

    // 將決策結果掛載到 request 上，供後續 Interceptor 使用
    request['rateLimitContext'] = {
      deviceId,
      shouldSetCookie,
      trustLevel,
    };

    const ip = request.ip || request.connection.remoteAddress;

    const limits = {
      uid: options?.uid,
      did: options?.did,
      global: options?.global,
      isolateScope: options?.isolateScope,
    };

    const isAllowed = await this.rateLimitService.checkAccess(
      ip,
      userId,
      deviceId,
      trustLevel,
      limits,
    );

    if (!isAllowed) {
      // NOTE: Calculate TTL dynamically
      throw new TooManyRequestsError(60);
    }

    return true;
  }
}
