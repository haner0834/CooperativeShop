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

    const { result: deviceIdResult } = this.deviceIdService.resolve(request);

    let trustLevel = TrustLevel.UNTRUSTED;

    const deviceId = deviceIdResult?.value ?? null;
    trustLevel = userId
      ? TrustLevel.AUTHENTICATED
      : deviceId
        ? deviceIdResult?.verified
          ? TrustLevel.DEVICE_COOKIE
          : TrustLevel.DEVICE_HEADER
        : TrustLevel.UNTRUSTED;

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
