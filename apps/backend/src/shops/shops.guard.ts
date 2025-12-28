import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TokenService } from 'src/auth/services/token.service';
import { env } from 'src/common/utils/env.utils';
import { RateLimitService } from 'src/rate-limit/rate-limit.service';
import { AuthError, TooManyRequestsError } from 'src/types/error.types';

@Injectable()
export class SchoolRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    const isExpensive = !!(
      query.q ||
      query.sortBy ||
      query.isOpen ||
      query.minLat
    );

    if (!isExpensive) return true;

    let schoolAbbr: string | null = request.user?.schoolAbbr || null;
    let isLimited: boolean | null = request.user?.isSchoolLimited || null;

    if (!schoolAbbr || isLimited) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = this.tokenService.verifyAccessToken(token);
        schoolAbbr = decoded?.schoolAbbr || null;
        isLimited = decoded?.isSchoolLimited ?? true;
      }
    }

    if (schoolAbbr && isLimited) {
      const isAllowed = await this.rateLimitService.checkSchoolQuota(
        schoolAbbr,
        Number(env('SCHOOL_FUNC_SHOPS_LIMIT')),
      );

      if (!isAllowed) {
        throw new TooManyRequestsError(
          60,
          'SCHOOL_QUOTA_EXCEEDED',
          '該學校今日的進階搜尋配額（150次）已用罄，請明日再試或使用基礎瀏覽功能。',
        );
      }
    } else {
      throw new AuthError('AUTH_REQUIRED', 'Login to access limited api');
    }

    return true;
  }
}
