import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../services/token.service';
import { BYPASS_JWT_KEY } from 'src/common/decorators/bypass-jwt.decorator';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const bypass = this.reflector.getAllAndOverride<boolean>(BYPASS_JWT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    // `RateLimitGuard` may be called before `JwtAccessGuard`, if authorized, it will add it to `request.user`
    if (request.user) return true;
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 沒有 token
      return bypass
        ? true
        : (() => {
            throw new UnauthorizedException('No token provided.');
          })();
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.tokenService.verifyAccessToken(token);

    if (!decoded) {
      // 有 token 但驗證失敗
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // token 驗證成功
    request.user = decoded;
    return true;
  }
}
