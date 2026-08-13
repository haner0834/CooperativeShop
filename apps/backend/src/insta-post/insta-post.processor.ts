import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { DelayedError, Job, Queue } from 'bullmq';
import {
  INSTAGRAM_POST_QUEUE,
  META_RATE_LIMIT_PER_ACCOUNT_PER_DAY,
  META_RATE_LIMIT_WINDOW_MS,
  rateLimitKeyForAccount,
} from './insta-post.constants';
import { PostPeerClient } from './postpeer.client';
import { CreateInstagramPostDto } from './dto/create-insta-post.dto';
import Redis from 'ioredis';

/**
 * 以 Redis sorted set 實作「滑動視窗」計數器，並用單一 EVAL 保證
 * 「檢查數量 + 佔位」是原子操作，避免 concurrency 同時搶到額度。
 *
 * KEYS[1] = rate key（每個 IG accountId 一組）
 * ARGV[1] = now (ms)
 * ARGV[2] = window (ms)
 * ARGV[3] = limit
 * ARGV[4] = member（唯一值，這裡用 jobId:timestamp）
 *
 * 回傳 [1, 目前佔用數] 代表佔位成功；
 * 回傳 [0, 目前佔用數, 最舊一筆的timestamp] 代表額度已滿。
 */
const RESERVE_SLOT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)
  return {1, count}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = 0
  if oldest[2] then
    oldestScore = oldest[2]
  end
  return {0, count, oldestScore}
end
`;

@Processor(INSTAGRAM_POST_QUEUE, {
  concurrency: 5,
})
export class InstagramPostProcessor extends WorkerHost {
  private readonly logger = new Logger(InstagramPostProcessor.name);

  constructor(
    private readonly postPeerClient: PostPeerClient,
    @InjectQueue(INSTAGRAM_POST_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async process(job: Job<CreateInstagramPostDto>, token?: string) {
    const dto = job.data;
    const rateKey = rateLimitKeyForAccount(dto.accountId);
    const redis = (await this.queue.client) as unknown as Redis;
    const now = Date.now();
    const member = `${job.id}:${now}`;

    const [reserved, count, oldestScore] = (await redis.eval(
      RESERVE_SLOT_SCRIPT,
      1,
      rateKey,
      now,
      META_RATE_LIMIT_WINDOW_MS,
      META_RATE_LIMIT_PER_ACCOUNT_PER_DAY,
      member,
    )) as [number, number, number?];

    if (reserved === 0) {
      // 該帳號今天（滾動 24 小時）已經發滿 25 篇，把 job 延後到「最舊一篇」
      // 過期釋出額度的時間點再重試，不算失敗、不消耗 attempts。
      const availableAt =
        (oldestScore ?? now) + META_RATE_LIMIT_WINDOW_MS + 1_000;
      this.logger.warn(
        `Account ${dto.accountId} 已達 Meta 每日 ${META_RATE_LIMIT_PER_ACCOUNT_PER_DAY} 篇上限（目前 ${count} 篇），` +
          `job ${job.id} 延後至 ${new Date(availableAt).toISOString()} 再處理`,
      );
      await job.moveToDelayed(availableAt, token);
      throw new DelayedError();
    }

    this.logger.log(
      `Processing job ${job.id} for account ${dto.accountId}（今日第 ${count + 1}/${META_RATE_LIMIT_PER_ACCOUNT_PER_DAY} 篇）`,
    );

    try {
      const result = await this.postPeerClient.createPost({
        content: dto.content,
        mediaItems: dto.mediaItems,
        platforms: [{ platform: 'instagram', accountId: dto.accountId }],
        publishNow: !dto.scheduledFor,
        scheduledFor: dto.scheduledFor,
        timezone: dto.timezone,
      });

      return result;
    } catch (err) {
      // 呼叫失敗（尚未真正成功發文）→ 釋放剛剛佔用的額度，避免白白浪費一個名額
      await redis.zrem(rateKey, member);

      if (this.isMetaRateLimitError(err)) {
        // PostPeer/Meta 自己也回報了 rate limit（例如帳號在別處也有在發文，
        // 導致我們本地計數落後於 Meta 實際狀態），統一延後 1 小時後重試。
        const retryAt = Date.now() + 60 * 60 * 1000;
        this.logger.warn(
          `PostPeer/Meta 回報 rate limit（account ${dto.accountId}），job ${job.id} 延後至 ${new Date(retryAt).toISOString()} 再處理`,
        );
        await job.moveToDelayed(retryAt, token);
        throw new DelayedError();
      }

      throw err;
    }
  }

  /**
   * 判斷錯誤是否為 Meta/PostPeer 回報的 rate limit（例如 HTTP 429，
   * 或 Meta Graph API 常見的 OAuthException code 4 / 17 / 32 / 613）。
   * 依實際 PostPeer 回傳格式微調即可。
   */
  private isMetaRateLimitError(err: any): boolean {
    const status = err?.response?.status;
    const metaErrorCode = err?.response?.data?.error?.code;
    const rateLimitCodes = [4, 17, 32, 613];
    return status === 429 || rateLimitCodes.includes(metaErrorCode);
  }
}
