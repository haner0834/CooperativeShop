import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../services/token.service';
import { BYPASS_JWT_KEY } from 'src/common/decorators/bypass-jwt.decorator';
import {
  RequireRoleOptions,
  REQUIRE_ROLE,
} from 'src/common/decorators/require-role.decorator';
import { AdminService } from '../services/admin.service';
import { AdminLevel } from '@prisma/client';

// SCHOOL 是 ORGANIZATION 的子集：要求 SCHOOL 時，ORGANIZATION admin 也該放行
const LEVEL_RANK: Record<AdminLevel, number> = {
  SCHOOL: 0,
  ORGANIZATION: 1,
};

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private adminService: AdminService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const bypass = this.reflector.getAllAndOverride<boolean>(BYPASS_JWT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const options = this.reflector.getAllAndOverride<RequireRoleOptions>(
      REQUIRE_ROLE,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    // `RateLimitGuard` may be called before `JwtAccessGuard`, if authorized, it will add it to `request.user`
    if (request.user) return this.matchRoleAndLevel(options, request.user);

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // no token
      if (bypass) return true;
      throw new UnauthorizedException('No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.tokenService.verifyAccessToken(token);

    if (!decoded) {
      // 有 token 但驗證失敗
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // token 驗證成功
    request.user = decoded;

    return this.matchRoleAndLevel(options, request.user);
  }

  private async matchRoleAndLevel(
    options: RequireRoleOptions | undefined,
    request: any,
  ): Promise<boolean> {
    // 如果該 Route 沒有設定 @RequireRole，代表只要 Token 合法即可放行
    if (!options) {
      return true;
    }

    if (options.role === 'USER') return true;

    // role: 'ADMIN' —— 絕對不信任 JWT 裡的任何角色宣稱，一律回頭查真正的來源
    const accountId: string | undefined = request.user?.accountId;
    if (!accountId) throw new UnauthorizedException();

    const adminContext = await this.adminService.getAdminContext(accountId);
    if (!adminContext) {
      throw new ForbiddenException('Admin only');
    }

    if (
      options.level &&
      LEVEL_RANK[adminContext.level] < LEVEL_RANK[options.level]
    ) {
      throw new ForbiddenException(`Requires ${options.level} level or above`);
    }

    request.admin = adminContext;

    return true;
  }
}
