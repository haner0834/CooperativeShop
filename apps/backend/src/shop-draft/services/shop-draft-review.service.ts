import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestError, NotFoundError } from 'src/types/error.types';
import { ShopDraft } from '@prisma/client';

@Injectable()
export class ShopDraftReviewService {
  constructor(
    private readonly prisma: PrismaService,
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

    if (currentVersion.reviewStatus !== 'IDLE') {
      throw new BadRequestError(
        'DRAFT_REVIEWD_OR_REVIEWING',
        'Target draft has been reviewed or being reviewed.',
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
}
