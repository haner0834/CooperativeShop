import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestError,
  InternalError,
  NotFoundError,
} from 'src/types/error.types';
import { Prisma, ReviewStatus, Shop, ShopDraft } from '@prisma/client';
import { InstaPostService } from 'src/insta-post/insta-post.service';
import { ReviewResult } from '../types/review-result.types';
import { env } from 'src/common/utils/env.utils';
import { ShopDraftDto } from '../dto/shop-draft.dto';
import { plainToInstance } from 'class-transformer';
import { mapDraftToCreateShopDto } from '../utils/shop-dto-transformer.utils';
import { ShopsService } from 'src/shops/shops.service';
import { UserPayload } from 'src/auth/types/auth.types';
import { AdminContext } from 'src/auth/types/admin-context.types';
import { getImageUrl } from 'src/common/utils/get-image-url.utils';
import { DraftWithRelations } from '../types/draft-with-relations.types';

@Injectable()
export class ShopDraftReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instaPostService: InstaPostService,
    private readonly shopsService: ShopsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getReviewSnapshot(draftId: string): Promise<DraftWithRelations> {
    const draft = await this.prisma.shopDraft.findUnique({
      where: { id: draftId },
      include: { currentVersion: true, versions: true, school: true },
    });

    if (!draft) throw new NotFoundError('DRAFT');

    if (!draft.currentVersion || draft.versions.length === 0) {
      throw new BadRequestError(
        'NO_SUBMISSION_RECORD',
        'No submission record found. Try another draft.',
      );
    }

    const { currentVersion, versions, aiGroundingSources, school, ...rest } =
      draft;

    // 只有兩個 org admin，不再鎖定 reviewer。
    // 任何 admin 都能在送出審核結果前隨時拿 snapshot，
    // reviewer 是誰要等到真正送出審核結果 (reviewDraft) 時才決定。
    if (currentVersion.reviewStatus !== 'IDLE') {
      throw new BadRequestError(
        'DRAFT_REVIEWD',
        'Target draft has already been reviewed.',
      );
    }

    const snapshot = currentVersion.snapshot as unknown as DraftWithRelations;
    if (!snapshot) throw new InternalError('Snapshot not found.');

    snapshot.currentVersion = currentVersion;
    snapshot.versions = versions;
    snapshot.school = school;
    // because ai grounding source is saved after snapshot was created
    snapshot.aiGroundingSources = aiGroundingSources;

    return snapshot;
  }

  async reviewDraft(
    draftId: string,
    reviewerAdminContext: AdminContext,
    result: ReviewResult,
    rejectReason?: string,
  ) {
    const draft = await this.prisma.shopDraft.findUnique({
      where: { id: draftId },
      include: { currentVersion: true, versions: true },
    });

    if (!draft) throw new NotFoundError('DRAFT');

    if (!draft.currentVersion || draft.versions.length === 0) {
      throw new BadRequestError(
        'NO_SUBMISSION_RECORD',
        'No submission record found. Try another draft.',
      );
    }

    const status = draft.currentVersion.reviewStatus;
    if (status !== 'IDLE') {
      throw new BadRequestError(
        'ALREADY_REVIEWED',
        'This draft has already been reviewed.',
      );
    }

    const reviewerId = reviewerAdminContext.adminId;

    if (result === 'APPROVE') {
      // upsert shop
      const draftFromSnapshot = draft.currentVersion.snapshot;
      const draftDto = plainToInstance(ShopDraftDto, draftFromSnapshot, {
        excludeExtraneousValues: true,
      });

      const createShopDto = mapDraftToCreateShopDto(draftDto);

      if (!draft.shopId) {
        const created = await this.shopsService.create(createShopDto);
        draftDto.shopId = created.id;
      } else {
        const mockUserPayload: UserPayload = {
          id: 'ADMIN_HAHA_PIYAN',
          accountId: reviewerAdminContext.accountId,
          name: 'PIYAN SUPERMAN',
          schoolId: reviewerAdminContext.schoolId ?? 'fuck you',
          schoolAbbr: '',
          schoolName: 'haha piyan',
          isSchoolLimited: false,
          provider: 'google',
          joinAt: new Date().toISOString(),
        };

        await this.shopsService.update(
          draft.shopId,
          mockUserPayload,
          createShopDto,
        );
      }

      await this.prisma.shopDraftVersion.update({
        where: { id: draft.currentVersion.id },
        data: {
          reviewStatus: 'SUCCESS',
          rejectReason: null,
          reviewerId,
          reviewedAt: new Date(),
        },
      });

      await this.prisma.shopDraft.update({
        where: { id: draft.id },
        data: { stage: 'APPROVED' },
      });

      await this.instaPostService.schedulePostFromShop(draftDto);
    } else if (result === 'REJECT') {
      if (!rejectReason)
        throw new BadRequestError(
          'MISSING_REJECT_REASON',
          'You idiot u forgot to put regect reason.',
        );

      await this.prisma.shopDraftVersion.update({
        where: { id: draft.currentVersion.id },
        data: {
          reviewStatus: 'REJECT',
          rejectReason,
          reviewerId,
          reviewedAt: new Date(),
        },
      });
    }
  }
}
