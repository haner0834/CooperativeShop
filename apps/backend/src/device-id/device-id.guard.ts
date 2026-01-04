import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { DeviceIdService } from './device-id.service';
import { DeviceIdResult } from './types/device-id-result';

@Injectable()
export class DeviceIdGuard implements CanActivate {
  constructor(private readonly deviceIdService: DeviceIdService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    let result: DeviceIdResult = null;

    const fromCookie = req.cookies?.['d_id'];
    if (fromCookie) {
      const verifiedId = this.deviceIdService.verifyDeviceId(fromCookie);
      if (verifiedId) {
        result = { value: verifiedId, verified: true, source: 'cookie' };
      }
    }

    if (!result) {
      const fromHeader = req.headers['x-device-id'];
      if (typeof fromHeader === 'string') {
        result = { value: fromHeader, verified: false, source: 'header' };
      }
    }

    req['__device_id_result__'] = result;
    return true;
  }
}
