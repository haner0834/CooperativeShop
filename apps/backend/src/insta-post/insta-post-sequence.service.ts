import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  INSTAGRAM_POST_QUEUE,
  INSTA_POST_SEQUENCE_KEY,
  COVER_STYLE_CYCLE,
  FLIP_CYCLE,
} from './insta-post.constants';

export interface PostVisualState {
  /** cover 底圖要用哪個 style（0,1,2 循環）*/
  coverStyle: 0 | 1 | 2;
  /** cover 這篇要用正(0)還是反(1) */
  coverFlip: 0 | 1;
  /** info 頁要用正還是反（永遠跟 cover 相反）*/
  infoFlip: 0 | 1;
  /** description 頁要用正還是反（永遠跟 cover 相同）*/
  descriptionFlip: 0 | 1;
  /** 這是全站第幾篇貼文（0-based），主要留給呼叫端做記錄/除錯用 */
  sequenceIndex: number;
}

/**
 * 用 Redis INCR 對「每一篇要生成圖片的貼文」配一組遞增序號，
 * 再用序號推導出 cover style（0,1,2 循環）以及 cover / info /
 * description 三個頁面各自要用「正」還是「反」。
 *
 * 規則（依需求）：
 *   - coverStyle       = seq % 3
 *   - coverFlip        = seq % 2   // 第一篇正、第二篇反、第三篇正...
 *   - infoFlip         = 1 - coverFlip
 *   - descriptionFlip  = coverFlip
 *
 * 設計上的取捨：
 *   這個序號是在「生成圖片、把貼文排入佇列」的當下決定
 *  （也就是 InstaPostService.schedulePostFromShop 呼叫的時候），
 *   而不是在 InstagramPostProcessor 實際發文的當下決定。
 *   原因是圖片必須在排程前就先生成好、上傳好。
 *
 *   這代表正反/style 的循環反映的是「貼文建立順序」，不是
 *   「實際發到 Instagram 的順序」——因為 rate limiter 可能會把
 *   某幾篇貼文延後好幾個小時才真正發出去。如果之後需求變成一定要
 *   跟「實際發文順序」綁定，這個邏輯需要搬進 processor 內，並且要
 *   把抽到的序號存進 job data，避免同一篇 job 被 delay/retry 時重複
 *   拿新號碼。
 *
 * 持久性（對應原本問題 5）：
 *   INCR 本身即為原子操作，不需要額外的 Lua script。
 *   這個 key 完全不設 TTL，所以只要 Redis 的持久化（AOF/RDB）有開，
 *   重啟後這個計數不會歸零、也不會遺失。唯一要注意的是 Redis 的
 *   maxmemory-policy 不能是 allkeys-* 系列的淘汰策略（BullMQ 本身
 *   通常就會要求 noeviction，所以多半已經符合）。
 *
 *   建議額外把每次抽到的 sequenceIndex 存進對應貼文的資料庫記錄裡，
 *   這樣萬一 Redis 資料真的遺失，還能用資料庫記錄回推、reseed 這個
 *   計數器（SET key <目前最大 index + 1>）。
 */
@Injectable()
export class InstaPostSequenceService {
  constructor(
    @InjectQueue(INSTAGRAM_POST_QUEUE) private readonly queue: Queue,
  ) {}

  async next(): Promise<PostVisualState> {
    const redis = (await this.queue.client) as unknown as Redis;

    const raw = await redis.incr(INSTA_POST_SEQUENCE_KEY);
    const sequenceIndex = raw - 1; // INCR 從 1 開始，轉成 0-based

    const coverStyle = (sequenceIndex % COVER_STYLE_CYCLE) as 0 | 1 | 2;
    const coverFlip = (sequenceIndex % FLIP_CYCLE) as 0 | 1;
    const infoFlip = (1 - coverFlip) as 0 | 1;
    const descriptionFlip = coverFlip;

    return {
      coverStyle,
      coverFlip,
      infoFlip,
      descriptionFlip,
      sequenceIndex,
    };
  }
}
