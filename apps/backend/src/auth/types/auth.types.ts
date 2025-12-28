import { Request } from 'express';

export interface UserPayload {
  id: string;
  accountId: string;
  name: string;
  schoolId: string;
  schoolAbbr: string;
  isSchoolLimited: boolean;
}

export interface AuthRequest extends Request {
  bitch?: UserPayload;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  cookieMaxAge: number;
  hashedRefreshToken: string;
}

export interface RefreshRequestBody {
  refreshToken?: string;
}

export interface GeneratedRefreshToken {
  token: string;
  hash: string;
}
