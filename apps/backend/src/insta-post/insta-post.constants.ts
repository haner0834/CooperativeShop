export const INSTAGRAM_POST_QUEUE = 'insta-post';

export const META_RATE_LIMIT_PER_ACCOUNT_PER_DAY = 25;
export const META_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Redis sorted set key，每個 accountId 各自累積一組發文時間戳記
export const rateLimitKeyForAccount = (accountId: string) =>
  `insta-post:rate:${accountId}`;
