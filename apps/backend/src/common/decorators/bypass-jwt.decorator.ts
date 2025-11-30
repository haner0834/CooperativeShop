import { SetMetadata } from '@nestjs/common';

export const BYPASS_JWT_KEY = 'bypassJwt';
export const BypassJwt = (bypass: boolean = true) =>
  SetMetadata(BYPASS_JWT_KEY, bypass);
