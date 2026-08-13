export const INSTAGRAM_POST_QUEUE = 'insta-post';

export const META_RATE_LIMIT_PER_ACCOUNT_PER_DAY = 25;
export const META_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Redis sorted set key，每個 accountId 各自累積一組發文時間戳記
export const rateLimitKeyForAccount = (accountId: string) =>
  `insta-post:rate:${accountId}`;

// ---- 底圖樣式循環（cover style / 正反 flip）----
//
// 用單一 Redis key（INCR）追蹤「目前是第幾篇貼文」，
// 再由這個序號推導出這篇貼文的 cover style 與各頁面的正反。
// 這個 key 不設 TTL，永久累加，仰賴 Redis 本身的持久化設定
// （AOF/RDB）與 noeviction 策略來確保不會遺失/被驅逐。
export const INSTA_POST_SEQUENCE_KEY = 'insta-post:visual-sequence';

// cover 有 3 種 style，依序循環：0, 1, 2, 0, 1, 2, ...
export const COVER_STYLE_CYCLE = 3;

// 正/反 兩種狀態的循環（0 = 正, 1 = 反）
export const FLIP_CYCLE = 2;
