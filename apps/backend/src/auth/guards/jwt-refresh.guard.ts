import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided.');
    }

    const decoded = this.tokenService.verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    // 將解碼後的用戶資訊附加到 request 上
    request.user = decoded;

    return true;
  }
}
