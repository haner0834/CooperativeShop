import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import {
  ConflictError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
} from 'src/types/error.types';
import { NormalizedDraftDraftKey } from './types/normalized-draft-key.types';
import levenshtein from 'fast-levenshtein';

@Injectable()
export class ShopDraftService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private calculateNormalizedKey(
    title: string,
    subtitle: string,
  ): NormalizedDraftDraftKey {
    const normalize = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[\s　]+/g, '')
        .replace(/[（()]/g, '(')
        .replace(/[）)]/g, ')');

    return {
      title: normalize(title),
      subtitle: normalize(subtitle || ''),
      fullKey: `${normalize(title)}|${normalize(subtitle || '')}`,
    };
  }

  private similarityScore(a: string, b: string): number {
    if (!a && !b) return 1; // 都空視為相同
    if (!a || !b) return 0; // 其中一個空視為完全不同

    const distance = levenshtein.get(a, b);
    const maxLen = Math.max(a.length, b.length);

    // 相似度 = 1 - (距離占最長字串的比例)
    return 1 - distance / maxLen;
  }

  private draftSimilarityScore(
    a: NormalizedDraftDraftKey,
    b: NormalizedDraftDraftKey,
  ) {
    const titleSimilarity = this.similarityScore(a.title, b.title);

    // subtitle 如果都是空，算完全相同；如果只有一個空，降分
    let subtitleSimilarity = 0.5; // 默認基礎分
    if (a.subtitle && b.subtitle) {
      subtitleSimilarity = this.similarityScore(a.subtitle, b.subtitle);
    } else if (!a.subtitle && !b.subtitle) {
      subtitleSimilarity = 1;
    } else {
      subtitleSimilarity = 0; // 一個有、一個沒有，直接判斷差很多
    }

    // title 權重 70%，subtitle 權重 30%
    return titleSimilarity * 0.7 + subtitleSimilarity * 0.3;
  }

  // -- Searcing --
  async search(title: string, subtitle: string) {
    const inputKey = this.calculateNormalizedKey(title, subtitle);

    // NOTE: Total drafts up to 300, so it's ok to compare all
    // WARNING: This is still dangerous if the data has grown
    const drafts = await this.prisma.shopDraft.findMany({
      select: {
        id: true,
        title: true,
        subtitle: true,
        thumbnailKey: true,
      },
    });

    const SIMILARITY_THRESHOLD = 0.5;

    const rankedDrafts = drafts
      .map((draft) => {
        // 對資料庫撈出來的每筆草稿也進行正規化
        const dbKey = this.calculateNormalizedKey(
          draft.title || '',
          draft.subtitle || '',
        );
        const score = this.draftSimilarityScore(inputKey, dbKey);

        return {
          ...draft,
          similarity: score,
        };
      })
      // 過濾掉相似度太低的資料
      .filter((draft) => draft.similarity >= SIMILARITY_THRESHOLD)
      // 依相似度由高到低排序
      .sort((a, b) => b.similarity - a.similarity);

    return rankedDrafts;
  }

  // -- Create Reserverance --

  // -- Sync Draft --
  // get, update

  // -- Submit Draft --

  // -- Reviewing Draft --

  // -- Confirm Draft --

  // -- List Out Drafts --
  // filter with specific stage

  // -- Editing Lock --
  async acquireLock(draftId: string, userId: string): Promise<string> {
    const lockToken = await this.prisma.$transaction(async (tx) => {
      // 檢查 draft 是否存在且可編輯
      const draft = await tx.shopDraft.findUnique({
        where: { id: draftId },
      });

      if (!draft) {
        throw new NotFoundError('DRAFT');
      }

      if (draft.stage === 'SUBMITTED') {
        throw new ConflictError(
          `CANNOT_EDIT_IN_SUBMITTED`,
          `Cannot edit the draft when it's submitted.`,
        );
      }

      // 檢查是否已有人鎖住（且鎖未過期）
      const existingLock = await tx.shopDraftLock.findUnique({
        where: { draftId },
      });

      if (existingLock) {
        const now = new Date();
        if (existingLock.expiresAt > now && existingLock.lockedBy !== userId) {
          // 被別人鎖住且還沒過期
          throw new ConflictError('LOCKED_BY_OTHERS', 'Locked by others.');
        }
        // 自己的鎖或已過期，更新鎖
        await tx.shopDraftLock.update({
          where: { id: existingLock.id },
          data: {
            lockedBy: userId,
            lockedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
          },
        });
      } else {
        // 沒有鎖，新建一個
        await tx.shopDraftLock.create({
          data: {
            draftId,
            lockedBy: userId,
            lockedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        });
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

      const lockToken: string = crypto.randomUUID();
      // Token 存在 cache（Redis 或內存）5分鐘，每次 API 呼叫驗證它
      await this.redis.set(
        `draft-lock-token:${draftId}:${userId}`,
        lockToken,
        'EX',
        5 * 60,
      );

      return lockToken;
    });

    return lockToken;
  }

  async updateField(
    draftId: string,
    userId: string,
    lockToken: string,
    field: string,
    value: any,
  ): Promise<void> {
    // 驗證 token 是否有效
    const cachedToken = await this.redis.get(
      `draft-lock-token:${draftId}:${userId}`,
    );

    if (cachedToken !== lockToken) {
      throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN');
    }

    // Token 有效，刷新過期時間
    await this.redis.set(
      `draft-lock-token:${draftId}:${userId}`,
      lockToken,
      'EX',
      5 * 60,
    );

    // 更新 draft
    try {
      await this.prisma.shopDraft.update({
        where: { id: draftId },
        data: { [field]: value },
      });
    } catch (error) {
      throw new InternalError('UPDATE_FAILED');
    }
  }

  async releaseLock(draftId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const lock = await tx.shopDraftLock.findUnique({
        where: { draftId },
      });

      if (lock && lock.lockedBy === userId) {
        await tx.shopDraftLock.delete({ where: { id: lock.id } });
      }
    });

    await this.redis.del(`draft-lock-token:${draftId}:${userId}`);
  }

  // -- Cron job --
  async cleanupExpiredLocks(): Promise<void> {
    await this.prisma.shopDraftLock.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
