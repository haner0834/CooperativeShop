import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type RankingType = 'home' | 'hot' | 'nearby';

type RankingSummaryEntry = {
  appearances: number;
  bestRank: number | null;
  avgScore: number | null;
  lastScore: number | null;
};

/**
 * 歸檔單一 shop：
 * 1. 把 WorkSchedule / ShopImage / contractFile 壓成 json snapshot
 * 2. 把 ShopDailyStat / ShopRanking 壓成 total（因為這兩張表不會被 cron 清掉）
 * 3. 寫入 ArchivedShop
 * 4. 手動清 UserShopDailyInteraction（這張表 shopId 沒有 FK/cascade，Shop 被刪不會自動清掉）
 * 5. 刪除 Shop（WorkSchedule / ShopImage / ShopDailyStat / ShopRanking / SavedShop / ShopDraft 都會被 cascade 清掉）
 *
 * NOTE: FileRecord / R2 檔案本體完全不動。
 */
export async function archiveShop(shopId: string) {
  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.findUniqueOrThrow({
      where: { id: shopId },
      include: {
        workSchedules: true,
        images: { include: { file: true }, orderBy: { order: 'asc' } },
        contractFile: true,
      },
    });

    const dailyStatTotals = await tx.shopDailyStat.aggregate({
      where: { shopId },
      _sum: { impressions: true, views: true, viewTimeSec: true, taps: true },
    });

    const rankingGroups = await tx.shopRanking.groupBy({
      by: ['type'],
      where: { shopId },
      _count: { _all: true },
      _min: { rank: true },
      _avg: { score: true },
    });

    const latestRankings = await tx.shopRanking.findMany({
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

    await tx.archivedShop.create({
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
        totalImpressions: dailyStatTotals._sum.impressions ?? 0,
        totalViews: dailyStatTotals._sum.views ?? 0,
        totalViewTimeSec: dailyStatTotals._sum.viewTimeSec ?? 0,
        totalTaps: dailyStatTotals._sum.taps ?? 0,
        rankingSummary: rankingSummary as unknown as Prisma.InputJsonValue,
      },
    });

    // UserShopDailyInteraction 沒有 relation/cascade，要自己清，不然會留下指向不存在 shop 的孤兒資料
    await tx.userShopDailyInteraction.deleteMany({ where: { shopId } });

    await tx.shop.delete({ where: { id: shopId } });
  });
}

/**
 * 批次歸檔。刻意用 sequential for-loop 而不是 Promise.all，
 * 避免同時開太多 transaction 打爆 DB；shop 數量多的話可以自行加上 batch/并发限制。
 */
export async function archiveShops(shopIds: string[]) {
  const failed: { shopId: string; error: unknown }[] = [];

  for (const shopId of shopIds) {
    try {
      await archiveShop(shopId);
    } catch (error) {
      failed.push({ shopId, error });
    }
  }

  if (failed.length > 0) {
    console.error('以下 shop 歸檔失敗，請檢查：', failed);
  }

  return { total: shopIds.length, failed: failed.length };
}
