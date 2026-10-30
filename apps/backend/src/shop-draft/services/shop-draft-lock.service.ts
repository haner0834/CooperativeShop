import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from 'src/types/error.types';

const LOCK_TTL_SECONDS = 5 * 60;

@Injectable()
export class ShopDraftLockService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private getLockKey(draftId: string): string {
    return `draft-lock:${draftId}`;
  }

  async acquireLock(draftId: string, userId: string): Promise<string> {
    const lockKey = this.getLockKey(draftId);
    const lockToken: string = crypto.randomUUID();
    const lockData = JSON.stringify({ userId, lockToken });

    // 1. 利用 Redis 的 NX (Not eXists) 進行原子性加鎖
    // 如果這把鎖已經存在且未過期，redis.set 會回傳 null (或非 'OK')
    const result = await this.redis.set(
      lockKey,
      lockData,
      'EX',
      LOCK_TTL_SECONDS,
      'NX',
    );

    if (!result) {
      // 鎖已經存在，檢查是不是同一個使用者嘗試重複拿鎖（例如重新整理或重複點擊）
      const existingLockStr = await this.redis.get(lockKey);
      if (existingLockStr) {
        const existingLock = JSON.parse(existingLockStr);
        if (existingLock.userId !== userId) {
          throw new ConflictError('LOCKED_BY_OTHERS', 'Locked by others.');
        }
        // 如果是同一個人重複拿鎖，我們可以選擇直接回傳他原本的 token，或者更新 token
        // 這裡直接回傳現有的 token，或更新都可以。為了安全起見，若同用戶重複請求，可回傳舊 token 或刷新。
        return existingLock.lockToken;
      } else {
        // 剛好在 get 的瞬間鎖過期被釋放了，可以再試一次或直接拋錯
        throw new ConflictError(
          'LOCK_ACQUIRE_FAILED',
          'Failed to acquire lock, please try again.',
        );
      }
    }

    // 2. 成功取得 Redis 鎖後，才去處理資料庫的狀態轉換
    try {
      await this.prisma.$transaction(async (tx) => {
        const draft = await tx.shopDraft.findUnique({
          where: { id: draftId },
        });

        if (!draft) {
          throw new NotFoundError('DRAFT');
        }

        // 轉換 draft stage
        if (draft.stage === 'RESERVED') {
          await tx.shopDraft.update({
            where: { id: draftId },
            data: {
              stage: 'EDITING',
              reservedUntil: null,
            },
          });
        }
      });
    } catch (error) {
      // 如果 DB 查詢或更新失敗（例如草稿不存在），必須把剛剛拿到 Redis 鎖釋放掉，才不會造成死鎖
      await this.redis.del(lockKey);
      throw error;
    }

    return lockToken;
  }

  async verifyLock(draftId: string, userId: string, lockToken: string) {
    const lockKey = this.getLockKey(draftId);
    const lockStr = await this.redis.get(lockKey);

    if (!lockStr) {
      throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN');
    }

    const lock = JSON.parse(lockStr);

    if (lock.userId !== userId || lock.lockToken !== lockToken) {
      throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN');
    }
  }

  async refreshToken(draftId: string, userId: string, lockToken: string) {
    // 延長壽命前，必須先驗證這個人確實持有這把鎖，避免任何人都可以幫忙刷 token
    await this.verifyLock(draftId, userId, lockToken);

    const lockKey = this.getLockKey(draftId);
    await this.redis.expire(lockKey, LOCK_TTL_SECONDS);
  }

  async verifyAndRefreshLock(
    draftId: string,
    userId: string,
    lockToken: string,
  ) {
    // 由於 refreshToken 內已經包含了 verifyLock，這裡直接呼叫 refreshToken 即可
    await this.refreshToken(draftId, userId, lockToken);
  }

  async releaseLock(draftId: string, userId: string): Promise<void> {
    const lockKey = this.getLockKey(draftId);
    const lockStr = await this.redis.get(lockKey);

    if (lockStr) {
      const lock = JSON.parse(lockStr);
      // 安全機制：確認這把鎖目前確實是該使用者的，才能將其刪除
      if (lock.userId === userId) {
        await this.redis.del(lockKey);
      }
    }
  }
}
