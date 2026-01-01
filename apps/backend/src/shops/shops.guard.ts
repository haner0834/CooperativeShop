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
    const response = context.switchToHttp().getResponse();
    const query = request.query;

    const isExpensive = !!(
      query.q ||
      query.sortBy === 'nearby' ||
      query.sortBy === 'hot' ||
      query.isOpen ||
      query.minLat
    );

    if (!isExpensive) return true;

    response.header('X-Expensive-Query', '1');

    let schoolAbbr: string | null = request.user?.schoolAbbr || null;
    let isLimited: boolean | null = request.user?.isSchoolLimited || null;

    if (!schoolAbbr || isLimited === null) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = this.tokenService.verifyAccessToken(token);
        if (!decoded)
          throw new AuthError('AUTH_REQUIRED', 'Login to access limited api');
        schoolAbbr = decoded.schoolAbbr;
        isLimited = decoded.isSchoolLimited;
        request.user = decoded;
      } else {
        throw new AuthError('AUTH_REQUIRED', 'Login to access limited api');
      }
    }

    if (isLimited) return true;

    const { allowed, remaining } = await this.rateLimitService.checkSchoolQuota(
      schoolAbbr,
      Number(env('SCHOOL_FUNC_SHOPS_LIMIT')),
    );

    response.header('X-School-Quota-Checked', '1');
    response.header('X-School-Quota-Remaining', String(remaining));

    if (!allowed) {
      throw new TooManyRequestsError(
        60,
        'SCHOOL_QUOTA_EXCEEDED',
        '該學校今日的進階搜尋配額（150次）已用罄，請明日再試或使用基礎瀏覽功能。',
      );
    }

    return true;
  }
}
