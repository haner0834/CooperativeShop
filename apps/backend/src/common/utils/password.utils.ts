import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { env } from './env.utils';

const SALT_ROUNDS = 10;

/**
 * 密碼雜湊策略：hash = bcrypt( HMAC-SHA256(serverSecret, `${salt}:${content}`) )
 *
 * - salt：存在 User / Admin 各自的 row 上，每個帳號不同。
 * - serverSecret：環境變數，永遠不進 DB，外洩 DB 不會直接讓密碼可被離線暴力破解。
 * - bcrypt：仍然保留 bcrypt 自身的 cost factor + 內建 salt，多一層保護。
 *
 * 目前只有 Admin 的登入流程在用這個 util。學生端 registerWithStudentId /
 * loginWithStudentId 目前是直接 bcrypt.hash(password) 沒有套用 User.salt，
 * 跟這裡的策略不一致 —— 這是既有落差，之後如果要讓學生端也對齊，
 * 直接把 hashPassword/verifyPassword 換過去即可，介面是相容的。
 */
function withServerSecret(salt: string, content: string): string {
  const serverSecret = env('PASSWORD_SERVER_SECRET');
  return crypto
    .createHmac('sha256', serverSecret)
    .update(`${salt}:${content}`)
    .digest('hex');
}

export async function hashPassword(
  content: string,
  salt: string,
): Promise<string> {
  return bcrypt.hash(withServerSecret(salt, content), SALT_ROUNDS);
}

export async function verifyPassword(
  content: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(withServerSecret(salt, content), hash);
}
