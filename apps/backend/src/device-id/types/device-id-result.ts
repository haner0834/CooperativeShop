export type DeviceIdResult =
  | { value: string; verified: true; source: 'cookie' }
  | { value: string; verified: false; source: 'header' }
  | null;
