import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { env } from 'src/common/utils/env.utils';

@Injectable()
export class DeviceIdService {
  private readonly HMAC_SECRET = env('DEVICE_ID_HMAC_SECRET');

  signDeviceId(deviceId: string): string {
    const hmac = crypto.createHmac('sha256', this.HMAC_SECRET);
    hmac.update(deviceId);
    return `${deviceId}.${hmac.digest('hex')}`;
  }

  verifyDeviceId(signedValue: string): string | null {
    if (!signedValue || !signedValue.includes('.')) return null;
    const [deviceId, signature] = signedValue.split('.');

    const hmac = crypto.createHmac('sha256', this.HMAC_SECRET);
    hmac.update(deviceId);
    const expectedSignature = hmac.digest('hex');

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    return deviceId;
  }
}
