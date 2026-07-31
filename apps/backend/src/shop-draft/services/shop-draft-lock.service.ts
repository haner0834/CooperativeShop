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

    // 1. 檢查 Redis 中是否已有鎖
    const existingLockStr = await this.redis.get(lockKey);
    if (existingLockStr) {
      const existingLock = JSON.parse(existingLockStr);
      // 如果鎖存在，且不是自己的，就拒絕
      if (existingLock.userId !== userId) {
        throw new ConflictError('LOCKED_BY_OTHERS', 'Locked by others.');
      }
    }

    // 2. 檢查草稿狀態與轉換 Stage (保留原本 DB 對草稿本身的狀態更新)
    await this.prisma.$transaction(async (tx) => {
      const draft = await tx.shopDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        throw new NotFoundError('DRAFT');
      }

      // if (draft.stage === 'SUBMITTED') {
      //   throw new ConflictError(
      //     `CANNOT_EDIT_IN_SUBMITTED`,
      //     `Cannot edit the draft when it's submitted.`,
      //   );
      // }

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

    // 3. 發放 Token 並寫入 Redis (儲存 userId 與 lockToken 以供後續驗證)
    const lockToken: string = crypto.randomUUID();
    const lockData = JSON.stringify({ userId, lockToken });

    // 設定鎖的過期時間
    await this.redis.set(lockKey, lockData, 'EX', LOCK_TTL_SECONDS);

    return lockToken;
  }

  async verifyLock(draftId: string, userId: string, lockToken: string) {
    const lockKey = this.getLockKey(draftId);
    const lockStr = await this.redis.get(lockKey);

    if (!lockStr) {
      throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN');
    }

    const lock = JSON.parse(lockStr);

    // 確保持有鎖的人是該 user，且 Token 相符
    if (lock.userId !== userId || lock.lockToken !== lockToken) {
      throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN');
    }
  }

  async refreshToken(draftId: string, userId: string, lockToken: string) {
    const lockKey = this.getLockKey(draftId);
    // 直接延長 Redis Key 的壽命
    await this.redis.expire(lockKey, LOCK_TTL_SECONDS);
  }

  async verifyAndRefreshLock(
    draftId: string,
    userId: string,
    lockToken: string,
  ) {
    await this.verifyLock(draftId, userId, lockToken);
    // If failed it would throw an error so the following won't be executed
    await this.refreshToken(draftId, userId, lockToken);
  }

  async releaseLock(draftId: string, userId: string): Promise<void> {
    const lockKey = this.getLockKey(draftId);
    const lockStr = await this.redis.get(lockKey);

    if (lockStr) {
      const lock = JSON.parse(lockStr);
      // 安全機制：確認這把鎖目前確實是該使用者的，才能將其刪除 (避免把別人的鎖誤刪)
      if (lock.userId === userId) {
        await this.redis.del(lockKey);
      }
    }
  }
}
