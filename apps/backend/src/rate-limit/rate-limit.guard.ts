import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { TooManyRequestsError } from 'src/types/error.types';
import { RateLimitOptions, RATE_LIMIT_KEY } from './rate-limit.decorator';
import { TokenService } from 'src/auth/services/token.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let userId: string | null = null;

    // 如果先前的 Guard (如 JwtAccessGuard) 已經解析過，直接用
    if (request.user?.id) {
      userId = request.user.id;
    } else {
      // 否則，被動檢查 Authorization Header
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = this.tokenService.verifyAccessToken(token);
        request.user = decoded;
        userId = decoded?.id || null;
      }
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limits = {
      uid: options?.uid ?? 100,
      did: options?.did ?? 50,
      global: options?.global ?? 500,
    };

    const ip = request.ip || request.connection.remoteAddress;
    const deviceId = request.headers['x-device-id'] || null;

    const isAllowed = await this.rateLimitService.checkAccess(
      ip,
      userId,
      deviceId,
      limits,
    );

    if (!isAllowed) {
      throw new TooManyRequestsError();
    }

    return true;
  }
}
