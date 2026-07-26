import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BadRequestError } from 'src/types/error.types';

export const EditLockToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.headers['x-edit-lock-token'];
    if (!token)
      throw new BadRequestError(
        'MISSING_LOCK_TOKEN',
        'you forgot to bring lock token idiot',
      );

    return token;
  },
);
