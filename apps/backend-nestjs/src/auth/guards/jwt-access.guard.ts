import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = this.tokenService.verifyAccessToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // 將解碼後的用戶資訊附加到 request 上
    request.user = decoded;

    return true;
  }
}
