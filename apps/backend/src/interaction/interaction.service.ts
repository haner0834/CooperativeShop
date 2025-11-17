import { Injectable } from '@nestjs/common';
import { IdentifierType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type InteractionMetric =
  | 'impressionCount'
  | 'viewCount'
  | 'tapCount'
  | 'viewTimeSec';

type MetricConfig = {
  userField: InteractionMetric;
  shopField: 'impressions' | 'views' | 'taps' | 'viewTimeSec';
  maxPerDay: number | null;
};

const METRIC_CONFIGS: Record<InteractionMetric, MetricConfig> = {
  impressionCount: {
    userField: 'impressionCount',
    shopField: 'impressions',
    maxPerDay: 3,
  },
  viewCount: {
    userField: 'viewCount',
    shopField: 'views',
    maxPerDay: 2,
  },
  tapCount: {
    userField: 'tapCount',
    shopField: 'taps',
    maxPerDay: 5,
  },
  viewTimeSec: {
    userField: 'tapCount',
    shopField: 'taps',
    maxPerDay: null,
  },
};

@Injectable()
export class InteractionService {
  constructor(private readonly prisma: PrismaService) {}

  private generateDayKey(): Date {
    const now = new Date();

    const dayKey = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    return dayKey;
  }

  async recordInteraction(
    shopId: string,
    identifier: string,
    identifierType: IdentifierType,
    metric: InteractionMetric,
    increment: number = 1,
  ) {
    const dayKey = this.generateDayKey();
    const config = METRIC_CONFIGS[metric];

    await this.prisma.$transaction(async (tx) => {
      // Check current state
      const existing = await tx.userShopDailyInteraction.findUnique({
        where: {
          identifier_identifierType_shopId_date: {
            shopId,
            identifier,
            identifierType,
            date: dayKey,
          },
        },
        select: { [config.userField]: true },
      });

      const currentCount = existing?.[config.userField] ?? 0;
      const shouldRecord = currentCount < (config.maxPerDay ?? 0);

      if (shouldRecord) {
        // Record the interaction
        await tx.userShopDailyInteraction.upsert({
          where: {
            identifier_identifierType_shopId_date: {
              shopId,
              identifier,
              identifierType,
              date: dayKey,
            },
          },
          create: {
            identifier,
            identifierType,
            shopId,
            date: dayKey,
            [config.userField]: 1,
          },
          update: {
            [config.userField]: { increment },
          },
        });

        // Increment global ShopDailyStat
        await tx.shopDailyStat.upsert({
          where: { shopId_date: { shopId, date: dayKey } },
          update: { [config.shopField]: { increment } },
          create: { shopId, date: dayKey, [config.shopField]: increment },
        });
      }
    });
  }

  // Then you can call it like:
  async recordImpression(
    shopId: string,
    identifier: string,
    identifierType: IdentifierType,
  ) {
    return this.recordInteraction(
      shopId,
      identifier,
      identifierType,
      'impressionCount',
    );
  }

  async recordView(
    shopId: string,
    identifier: string,
    identifierType: IdentifierType,
  ) {
    return this.recordInteraction(
      shopId,
      identifier,
      identifierType,
      'viewCount',
    );
  }

  async recordTap(
    shopId: string,
    identifier: string,
    identifierType: IdentifierType,
  ) {
    return this.recordInteraction(
      shopId,
      identifier,
      identifierType,
      'tapCount',
    );
  }

  async recordViewTimeSec(
    shopId: string,
    identifier: string,
    identifierType: IdentifierType,
    viewTimeSec: number,
  ) {
    return this.recordInteraction(
      shopId,
      identifier,
      identifierType,
      'viewTimeSec',
      viewTimeSec,
    );
  }
}
