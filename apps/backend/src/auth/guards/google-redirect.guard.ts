import { AuthGuard } from '@nestjs/passport';
import { env } from 'src/common/utils/env.utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleRedirectGuard extends AuthGuard('google') {
  handleRequest(err, user, info, context, status) {
    const res = context.switchToHttp().getResponse();

    if (err || !user) {
      const message = encodeURIComponent(
        err?.message || info?.message || 'Login failed',
      );
      const code = encodeURIComponent(err?.code || 'OAUTH_ERROR');
      return res.redirect(
        `${env('FRONTEND_URL_ROOT', '')}/login-failed?code=${code}&message=${message}`,
      );
    }

    return user;
  }
}
