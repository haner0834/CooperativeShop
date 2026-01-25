import { DeviceIdContext } from './device-id-context';
import { DeviceIdResult } from './device-id-result';

export interface DeviceIdResolution {
  result: DeviceIdResult | null;
  context: DeviceIdContext | null;
}
