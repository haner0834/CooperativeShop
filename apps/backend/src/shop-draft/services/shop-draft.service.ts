import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from 'src/types/error.types';
import { NormalizedDraftDraftKey } from '../types/normalized-draft-key.types';
import levenshtein from 'fast-levenshtein';
import { ShopDraftLockService } from './shop-draft-lock.service';
import { DraftWithRelations } from '../types/draft-with-relations.types';
import { DraftFilterOptions } from '../types/draft-filter-options.types';
import { Prisma } from '@prisma/client';
import { GetDraftOptions } from '../types/get-draft-options.types';
import { AiReviewService } from 'src/ai-review/ai-review.service';
import { plainToInstance } from 'class-transformer';
import { ShopDraftDto } from '../dto/shop-draft.dto';

@Injectable()
export class ShopDraftService {
  private readonly logger = new Logger(ShopDraftService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiReviewService: AiReviewService,
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
        normalizedKey: true,
        thumbnailKey: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const SIMILARITY_THRESHOLD = 0.5;

    const rankedDrafts = drafts
      .map((draft) => {
        const dbKey: NormalizedDraftDraftKey = {
          title: draft.title,
          subtitle: draft.subtitle,
          fullKey: draft.normalizedKey,
        };
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

  // -- Create Reserve --
  async createReserve(title: string, subtitle: string, schoolId: string) {
    const normalizedKey = this.calculateNormalizedKey(title, subtitle);

    try {
      return await this.prisma.shopDraft.create({
        data: {
          title,
          subtitle,
          normalizedKey: normalizedKey.fullKey,
          stage: 'RESERVED',
          schoolId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          'DRAFT_NORMALIZED_KEY_CONFLICT',
          "There's already a draft with the same title + subtitle",
        );
      }
      throw error;
    }
  }

  // -- Submit Draft --
  async submitDraft(
    draftId: string,
    userId: string,
    lockToken: string,
    options?: { overwrite?: boolean },
  ) {
    await this.lockService.verifyLock(draftId, userId, lockToken);

    const draft = await this.prisma.shopDraft.findUnique({
      where: { id: draftId },
      include: {
        currentVersion: true,
      },
    });
    if (!draft) throw new NotFoundError('DRAFT');
    if (draft.stage === 'SUBMITTED') {
      if (!options?.overwrite) {
        throw new ConflictError(
          'DRAFT_ALREADY_SUBMITTED',
          'i dont want to write msg. you know what youre doing so yeah fuck you <3',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const { currentVersion, ...pureDraft } = draft;

      // 已提交再提交
      if (
        draft.stage === 'SUBMITTED' &&
        currentVersion &&
        currentVersion.reviewStatus === 'IDLE'
      ) {
        await tx.shopDraftVersion.update({
          where: { id: currentVersion.id },
          data: { reviewStatus: 'SUPERSEDED' },
        });
      }

      const newVersion = await tx.shopDraftVersion.create({
        data: {
          draftId: draftId,
          versionNo: (currentVersion?.versionNo ?? 0) + 1,
          snapshot: pureDraft,
          reviewStatus: 'IDLE',
          submittedAt: new Date(),
        },
      });

      await tx.shopDraft.update({
        where: { id: draftId },
        data: {
          stage: 'SUBMITTED',
          currentVersionId: newVersion.id,
        },
      });
    });

    await this.lockService.releaseLock(draftId, userId);

    // Trigger AI Reviewing
    this.prisma.shopDraft
      .findUnique({
        where: { id: draftId },
      })
      .then(async (latestDraft) => {
        if (!latestDraft || !latestDraft.currentVersionId) return;
        this.logger.error(`[AI_REVIEW] 背景預審開始`);
        const reviewResult = await this.aiReviewService.reviewDraft(
          plainToInstance(ShopDraftDto, latestDraft),
        );

        await this.prisma.shopDraftVersion.update({
          where: { id: latestDraft.currentVersionId },
          data: {
            aiReviewResult: reviewResult as unknown as Prisma.InputJsonValue,
            reviewStatus: reviewResult.isPassed ? 'IDLE' : 'AI_REJECT',
          },
        });
      })
      .catch((error) => {
        this.logger.error(
          `[AI_REVIEW] 背景預審發生錯誤: ${error.message}`,
          error.stack,
        );
      });
  }

  // -- List Out Drafts --
  private getIncludeFromOptions(
    options?: GetDraftOptions,
  ): Prisma.ShopDraftInclude {
    const include: Prisma.ShopDraftInclude = {};
    if (options?.school) include.school = true;
    if (options?.shop) include.shop = true;
    if (options?.currentVersion) include.currentVersion = true;
    if (options?.versions) include.versions = true;
    return include;
  }

  async getDrafts(
    filters: DraftFilterOptions,
    options?: GetDraftOptions,
  ): Promise<DraftWithRelations[]> {
    const { stage, schoolAbbr } = filters;

    const where: Prisma.ShopDraftWhereInput = {};
    if (stage) {
      where.stage = stage;
    }
    if (schoolAbbr) {
      where.school = {
        abbreviation: schoolAbbr,
      };
    }

    // 2. 動態構建關聯查詢 (Include)
    const include = this.getIncludeFromOptions(options);

    // 3. 組裝查詢物件
    const query: Prisma.ShopDraftFindManyArgs = { where };

    // 如果 include 裡面有任何一個欄位被設為 true，才帶入 include 參數
    if (Object.keys(include).length > 0) {
      query.include = include;
    }

    return this.prisma.shopDraft.findMany(query) as Promise<
      DraftWithRelations[]
    >;
  }

  // -- Sync Draft --

  async getDraft(
    draftId: string,
    options: GetDraftOptions = { school: true, currentVersion: true },
  ) {
    const include = this.getIncludeFromOptions(options);

    const draft: DraftWithRelations | null =
      await this.prisma.shopDraft.findUnique({
        where: { id: draftId },
        include,
      });

    if (!draft) {
      throw new NotFoundError('DRAFT');
    }

    return draft;
  }

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
