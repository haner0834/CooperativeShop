import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DeviceIdService } from './device-id.service';
import { DeviceIdResult } from './types/device-id-result';

@Injectable()
export class DeviceIdGuard implements CanActivate {
  constructor(private readonly deviceIdService: DeviceIdService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    let { result, context: deviceContext } = this.deviceIdService.resolve(req);

    req['__device_id_result__'] = result;
    if (deviceContext) req['__device_id_context__'] = deviceContext;
    return true;
  }
}
