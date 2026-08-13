import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtAdminRefreshGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const refreshToken = request.cookies?.adminRefreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided.');
    }

    const decoded = this.tokenService.verifyAdminRefreshToken(refreshToken);

    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    request.adminRefreshPayload = decoded;

    return true;
  }
}
