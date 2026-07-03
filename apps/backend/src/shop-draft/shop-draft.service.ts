import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConflictError, InternalError } from 'src/types/error.types';
import { NormalizedDraftDraftKey } from './types/normalized-draft-key.types';
import levenshtein from 'fast-levenshtein';
import { ShopDraftLockService } from './services/shop-draft-lock.service';

@Injectable()
export class ShopDraftService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly lockService: ShopDraftLockService,
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

  async updateField(
    draftId: string,
    userId: string,
    lockToken: string,
    field: string,
    value: any,
  ): Promise<void> {
    await this.lockService.verifyAndRefreshLock(draftId, userId, lockToken);

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
}
