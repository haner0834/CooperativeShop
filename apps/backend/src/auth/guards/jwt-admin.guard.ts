import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { AdminService } from '../services/admin.service';

/**
 * Admin console 專用 guard，跟學生端的 JwtAccessGuard 完全分開。
 *
 * 現階段只服務 org level admin，所以直接擋掉非 ORGANIZATION 的 admin。
 * 未來要開放 school level admin console 時，可以在這裡加一個
 * @RequireAdminLevel() decorator，比照 JwtAccessGuard 的 LEVEL_RANK 做法即可，
 * 現在先不加避免過度設計。
 */
@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.tokenService.verifyAdminAccessToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // 不信任 token 裡的 level/isActive 宣稱，一律回頭查真正的來源
    // （跟 JwtAccessGuard 對學生端 ADMIN role 的處理原則一致）
    const adminContext = await this.adminService.getAdminContext(
      decoded.accountId,
    );
    if (!adminContext) {
      throw new ForbiddenException('Admin only');
    }

    if (adminContext.level !== 'ORGANIZATION') {
      throw new ForbiddenException('Requires ORGANIZATION level admin');
    }

    request.admin = adminContext;

    return true;
  }
}
