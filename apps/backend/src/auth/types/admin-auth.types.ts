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
  adminId: string;
  name: string;
  email: string;
  level: AdminLevel;
  schoolId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createAt: Date;
  /** 這個 admin 目前連了哪些登入方式，例如 ['credentials', 'google'] */
  linkedProviders: string[];
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

// ================= Google OAuth =================

/** GoogleAdminStrategy 從 Google profile 整理出來、給 service 用的乾淨資料 */
export interface AdminGoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * 塞進 OAuth state 參數的資料（base64 JSON，附在導去 Google 的 URL 上，
 * Google 會原樣帶回 callback）。
 *
 * inviteToken 為 null 代表這是「既有 admin 登入」；
 * 有值則代表這是「打開邀請連結 → 用 Google 登入」，
 * 只有在 callback 驗證 email 與邀請信相符時才會建立帳號。
 */
export interface AdminGoogleOAuthState {
  deviceId: string;
  inviteToken: string | null;
  /** 登入完成後前端要導回的頁面，純粹透傳，後端不驗證內容 */
  to: string | null;
}

/** completeGoogleAuth 成功後回傳的 session，跟原本 issueSession 的回傳形狀一致 */
export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  cookieMaxAge: number;
  admin: AdminPayload;
}

/** GoogleAdminStrategy 回傳給 controller 的完整結果：session + 透傳的 to */
export interface AdminGoogleAuthResult extends AdminSession {
  to: string | null;
}
