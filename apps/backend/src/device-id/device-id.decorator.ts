import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DeviceIdResult } from './types/device-id-result';

export const DeviceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DeviceIdResult => {
    const req = ctx.switchToHttp().getRequest();
    return req['__device_id_result__'] || null;
  },
);
