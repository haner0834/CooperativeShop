import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type RankingType = 'home' | 'hot' | 'nearby';

type RankingSummaryEntry = {
  appearances: number;
  bestRank: number | null;
  avgScore: number | null;
  lastScore: number | null;
};

type DailyStatTotals = {
  impressions: number;
  views: number;
  viewTimeSec: number;
  taps: number;
};

export type ArchiveShopPreview = {
  shopId: string;
  title: string;
  totals: DailyStatTotals;
  rankingSummary: Partial<Record<RankingType, RankingSummaryEntry>>;
  imageCount: number;
  hasContractFile: boolean;
};

export type ArchiveShopResult = {
  shopId: string;
  archivedShopId: string;
};

export type ArchiveShopsSummary = {
  total: number;
  succeeded: ArchiveShopResult[];
  failed: { shopId: string; error: string }[];
};

@Injectable()
export class ArchiveShopsService {
  private readonly logger = new Logger(ArchiveShopsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 列出目前所有 shop id，給 --all 批次歸檔用。
   * excludeIds 可以用來保護不想被這次批次動到的 shop。
   */
  async listShopIds(excludeIds: string[] = []): Promise<string[]> {
    const shops = await this.prisma.shop.findMany({
      select: { id: true },
      where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
    });
    return shops.map((s) => s.id);
  }

  /**
   * Dry-run：只計算歸檔後會長怎樣，完全不寫入、不刪除任何資料。
   * 正式歸檔前務必先用這個確認清單正確。
   */
  async previewArchive(shopId: string): Promise<ArchiveShopPreview> {
    const shop = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
      include: {
        images: true,
        contractFile: true,
      },
    });

    const { dailyStatTotals, rankingSummary } = await this.computeAggregates(
      shopId,
      this.prisma,
    );

    return {
      shopId: shop.id,
      title: shop.title,
      totals: dailyStatTotals,
      rankingSummary,
      imageCount: shop.images.length,
      hasContractFile: !!shop.contractFile,
    };
  }

  /**
   * 真正歸檔並刪除單一 shop，整個流程包在一個 transaction 裡：
   * 1. WorkSchedule / ShopImage / contractFile 壓成 json snapshot
   * 2. ShopDailyStat / ShopRanking 壓成 total（這兩張表不會被 cron 清掉）
   * 3. 寫入 ArchivedShop
   * 4. 手動清 UserShopDailyInteraction（沒有 relation/cascade）
   * 5. 刪除 Shop（WorkSchedule / ShopImage / ShopDailyStat / ShopRanking / SavedShop / ShopDraft 都會被 cascade 清掉）
   */
  async archiveShop(shopId: string): Promise<ArchiveShopResult> {
    return this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUniqueOrThrow({
        where: { id: shopId },
        include: {
          workSchedules: true,
          images: { include: { file: true }, orderBy: { order: 'asc' } },
          contractFile: true,
        },
      });

      const { dailyStatTotals, rankingSummary } = await this.computeAggregates(
        shopId,
        tx,
      );

      const workSchedulesSnapshot = shop.workSchedules.map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinute: w.startMinute,
        endMinute: w.endMinute,
        type: w.type,
        scheduleNote: w.scheduleNote,
      }));

      const imagesSnapshot = shop.images.map((img) => ({
        fileId: img.fileId,
        fileKey: img.file.fileKey,
        url: img.file.url,
        order: img.order,
      }));

      const contractFileSnapshot = shop.contractFile
        ? {
            fileId: shop.contractFile.id,
            fileKey: shop.contractFile.fileKey,
            url: shop.contractFile.url,
          }
        : null;

      const archived = await tx.archivedShop.create({
        data: {
          originalShopId: shop.id,
          title: shop.title,
          subTitle: shop.subTitle,
          description: shop.description,
          contactInfo: shop.contactInfo as Prisma.InputJsonValue,
          thumbnailKey: shop.thumbnailKey,
          discount: shop.discount,
          discountTerms: shop.discountTerms,
          address: shop.address,
          longitude: shop.longitude,
          latitude: shop.latitude,
          schoolId: shop.schoolId,
          workSchedules: workSchedulesSnapshot as Prisma.InputJsonValue,
          images: imagesSnapshot as Prisma.InputJsonValue,
          contractFile: contractFileSnapshot as Prisma.InputJsonValue,
          totalImpressions: dailyStatTotals.impressions,
          totalViews: dailyStatTotals.views,
          totalViewTimeSec: dailyStatTotals.viewTimeSec,
          totalTaps: dailyStatTotals.taps,
          rankingSummary: rankingSummary as unknown as Prisma.InputJsonValue,
        },
      });

      // UserShopDailyInteraction 沒有 relation/cascade，要自己清，不然會留下指向不存在 shop 的孤兒資料
      await tx.userShopDailyInteraction.deleteMany({ where: { shopId } });

      await tx.shop.delete({ where: { id: shopId } });

      this.logger.log(`Archived shop ${shopId} -> archivedShop ${archived.id}`);

      return { shopId, archivedShopId: archived.id };
    });
  }

  /**
   * 批次歸檔，sequential 執行避免同時開太多 transaction。
   * 單一 shop 失敗不影響其他 shop，失敗清單回傳供人工複查，不會拋出整批中斷。
   */
  async archiveShops(shopIds: string[]): Promise<ArchiveShopsSummary> {
    const succeeded: ArchiveShopResult[] = [];
    const failed: { shopId: string; error: string }[] = [];

    for (let i = 0; i < shopIds.length; i++) {
      const shopId = shopIds[i];
      try {
        succeeded.push(await this.archiveShop(shopId));
      } catch (error) {
        this.logger.error(`Failed to archive shop ${shopId}`, error as Error);
        failed.push({
          shopId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if ((i + 1) % 10 === 0 || i + 1 === shopIds.length) {
        this.logger.log(`進度 ${i + 1}/${shopIds.length}`);
      }
    }

    if (failed.length > 0) {
      this.logger.warn(
        `Archive batch finished with ${failed.length} failure(s): ${JSON.stringify(failed)}`,
      );
    }

    return { total: shopIds.length, succeeded, failed };
  }

  private async computeAggregates(
    shopId: string,
    client: PrismaService | Prisma.TransactionClient,
  ) {
    const dailyStatAgg = await client.shopDailyStat.aggregate({
      where: { shopId },
      _sum: { impressions: true, views: true, viewTimeSec: true, taps: true },
    });

    const dailyStatTotals: DailyStatTotals = {
      impressions: dailyStatAgg._sum.impressions ?? 0,
      views: dailyStatAgg._sum.views ?? 0,
      viewTimeSec: dailyStatAgg._sum.viewTimeSec ?? 0,
      taps: dailyStatAgg._sum.taps ?? 0,
    };

    const rankingGroups = await client.shopRanking.groupBy({
      by: ['type'],
      where: { shopId },
      _count: { _all: true },
      _min: { rank: true },
      _avg: { score: true },
    });

    const latestRankings = await client.shopRanking.findMany({
      where: { shopId },
      orderBy: { date: 'desc' },
      distinct: ['type'],
      select: { type: true, score: true },
    });
    const latestScoreByType = Object.fromEntries(
      latestRankings.map((r) => [r.type, r.score]),
    );

    const rankingSummary: Partial<Record<RankingType, RankingSummaryEntry>> =
      Object.fromEntries(
        rankingGroups.map((g) => [
          g.type as RankingType,
          {
            appearances: g._count._all,
            bestRank: g._min.rank,
            avgScore: g._avg.score,
            lastScore: latestScoreByType[g.type] ?? null,
          },
        ]),
      );

    return { dailyStatTotals, rankingSummary };
  }
}
