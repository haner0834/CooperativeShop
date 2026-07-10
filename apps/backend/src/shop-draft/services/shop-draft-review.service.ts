import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestError, NotFoundError } from 'src/types/error.types';
import { ReviewStatus, Shop, ShopDraft } from '@prisma/client';
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

@Injectable()
export class ShopDraftReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instaPostService: InstaPostService,
    private readonly shopsService: ShopsService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getReviewSnapshot(
    draftId: string,
    reviewerId: string,
  ): Promise<ShopDraft> {
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

    const { currentVersion, versions, ...rest } = draft;

    const reviewStatus = currentVersion.reviewStatus;
    if (reviewStatus !== 'IDLE' && reviewStatus !== 'PROCESSING') {
      // they may close the app then request it again.
      // it's also allowed that reviewing same draft with different person,
      // as long as they are org admin.
      // but what if race condition? do i need to make another lock for this?
      // here i think i don't need to implement another lock,
      // because it could simply do a reviewer id lock,
      // wich means only same admin id(reviewer id) can regain data
      // if they want to change reviewer, they need to cancel it first
      // and that there're 2 org admins so the probability of race condition is fucking low

      throw new BadRequestError(
        'DRAFT_REVIEWD_OR_REVIEWING',
        'Target draft has been reviewed or being reviewed.',
      );
    }

    if (
      reviewStatus === 'PROCESSING' &&
      currentVersion.reviewerId !== null &&
      currentVersion.reviewerId !== reviewerId
    ) {
      throw new BadRequestError(
        'REVIEWER_MISMATCH',
        'Bruh. cancel it first ok?',
      );
    }

    await this.prisma.shopDraftVersion.update({
      where: { id: currentVersion.id },
      data: { reviewedAt: new Date(), reviewerId, reviewStatus: 'PROCESSING' },
    });

    const snapshot = JSON.parse(String(currentVersion.snapshot));

    currentVersion.reviewStatus = 'PROCESSING';
    currentVersion.reviewerId = reviewerId;
    currentVersion.reviewedAt = new Date();

    snapshot.currentVersion = currentVersion;
    snapshot.versions = versions;

    return snapshot;
  }

  async cencelReview(draftId: string, reviewerId: string) {
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

    await this.prisma.shopDraftVersion.update({
      where: { id: draft.currentVersion.id },
      data: { reviewedAt: null, reviewerId: null, reviewStatus: 'IDLE' },
    });
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

    if (draft.currentVersion.reviewerId !== reviewerAdminContext.adminId) {
      throw new BadRequestError('REVIEWER_MISMATCH', 'Reviewer Mismatch.');
    }

    const status = draft.currentVersion.reviewStatus;
    if (status !== 'IDLE' && status !== 'PROCESSING') {
      throw new BadRequestError(
        'ALREADY_REVIEWED',
        'This draft has already been reviewed.',
      );
    }

    if (result === 'SUCCESS') {
      // upsert shop
      const draftFromSnapshot = JSON.parse(
        String(draft.currentVersion.snapshot),
      );
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
        data: { reviewStatus: 'SUCCESS', rejectReason: null },
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
        data: { reviewStatus: 'REJECT', rejectReason },
      });
    }
  }
}
