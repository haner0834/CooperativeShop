export type DeviceIdResult =
  | {
      value: string;
      verified: true;
      source: 'cookie';
      shouldSetCookie?: boolean;
    }
  | {
      value: string;
      verified: false;
      source: 'header';
      shouldSetCookie?: boolean;
    }
  | null;
