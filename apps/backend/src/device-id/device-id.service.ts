import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { env } from 'src/common/utils/env.utils';
import { DeviceIdResolution } from './types/device-id-resolotion';

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

  resolve(req: any): DeviceIdResolution {
    const fromCookie = req.cookies?.['d_id'];
    const fromHeader = req.headers['x-device-id'];

    const verifiedCookieId =
      typeof fromCookie === 'string' ? this.verifyDeviceId(fromCookie) : null;

    if (verifiedCookieId) {
      if (typeof fromHeader === 'string' && fromHeader !== verifiedCookieId) {
        return {
          result: {
            value: fromHeader,
            verified: false,
            source: 'header',
          },
          context: {
            deviceId: fromHeader,
            shouldSetCookie: true,
          },
        };
      }

      return {
        result: {
          value: verifiedCookieId,
          verified: true,
          source: 'cookie',
        },
        context: null,
      };
    }

    if (typeof fromHeader === 'string') {
      return {
        result: {
          value: fromHeader,
          verified: false,
          source: 'header',
        },
        context: {
          deviceId: fromHeader,
          shouldSetCookie: true,
        },
      };
    }

    return { result: null, context: null };
  }
}
