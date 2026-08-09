import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminContext } from 'src/auth/types/admin-context.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  },
);
