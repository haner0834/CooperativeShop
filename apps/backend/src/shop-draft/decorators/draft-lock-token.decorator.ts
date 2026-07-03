import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EditLockToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-edit-lock-token'];
  },
);
