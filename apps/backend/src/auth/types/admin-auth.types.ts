import { AdminLevel } from '@prisma/client';
import { CloudflareContext } from 'src/common/interceptors/cloudflare-context.interceptor';

/**
 * Admin 專用的 JWT payload，跟學生端的 UserPayload 完全脫鉤。
 *
 * 注意：level / schoolId 放在這裡純粹是給前端顯示用（例如 UI 上顯示「你是 org admin」），
 * 不能拿來做授權判斷。JwtAdminGuard 永遠會回頭查 AdminService 拿最新狀態，
 * 不信任 token 裡宣稱的 level —— 跟現有 JwtAccessGuard 對學生 admin 的處理原則一致。
 */
export interface AdminPayload {
  accountId: string;
  adminId: string;
  level: AdminLevel;
  schoolId: string | null;
  email: string;
  name: string;
}

export interface AdminRefreshTokenPayload {
  jti: string;
  accountId: string;
}

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
  cookieMaxAge: number;
  hashedRefreshToken: string;
}

export interface AdminAuthMeta extends Partial<CloudflareContext> {
  ip?: string;
  userAgent?: string;
}

export interface AdminInviteInfo {
  email: string;
  level: AdminLevel;
  schoolId: string | null;
}

export interface AdminListItem {
  accountId: string;
  adminId: string;
  name: string;
  email: string;
  level: AdminLevel;
  schoolId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createAt: Date;
}

export interface PendingInvite {
  id: string;
  email: string;
  level: AdminLevel;
  schoolId: string | null;
  expiresAt: Date;
  createAt: Date;
  invitedByName: string;
}
