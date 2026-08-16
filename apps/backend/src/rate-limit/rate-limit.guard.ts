import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService, TrustLevel } from './rate-limit.service';
import { TooManyRequestsError, UnauthorizedError } from 'src/types/error.types';
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
    let adminId: string | null = null;

    if (request.user?.id) {
      userId = request.user.id;
    } else if (request.orgAdmin?.adminId) {
      // JwtAdminGuard 可能已經在這之前跑過了（取決於 route 上兩個 guard 的順序），
      // request.orgAdmin 是它塞的、已經跟 AdminService 核對過的 AdminContext，直接用即可。
      adminId = request.orgAdmin.adminId;
    } else {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        // 學生 token 跟 admin token 是不同 secret 簽的，verify 失敗只會回傳 null，
        // 兩邊互不干擾，依序試過去即可。
        try {
          const decodedUser = this.tokenService.verifyAccessToken(token);
          if (decodedUser?.id) {
            request.user = decodedUser;
            userId = decodedUser.id;
          } else {
            const decodedAdmin =
              this.tokenService.verifyAdminAccessToken(token);
            if (decodedAdmin?.adminId) {
              // 注意：這裡刻意不寫進 request.orgAdmin —— 那個屬性名保留給
              // JwtAdminGuard 用來寫入「已經回頭跟 AdminService 驗證過」的 AdminContext。
              // 這裡拿到的只是 token 自己宣稱的內容，純粹拿來算 rate limit 配額用，
              // 不能當成「這個人真的是有效 admin」的證明——那件事還是要交給 JwtAdminGuard 做。
              request.orgAdminTokenPayload = decodedAdmin;
              adminId = decodedAdmin.adminId;
            }
          }

          // has authorization and fucked up with these verifications
          // treat as expired token
          // have to deal with whether to limit them in malicious cases
          if (!userId && !adminId) {
            throw new UnauthorizedError();
          }
        } catch (e) {
          /* Token invalid, treat as guest */
        }
      }
    }

    const { result: deviceIdResult } = this.deviceIdService.resolve(request);

    let trustLevel = TrustLevel.UNTRUSTED;

    const deviceId = deviceIdResult?.value ?? null;
    trustLevel =
      userId || adminId
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
      adminId,
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
