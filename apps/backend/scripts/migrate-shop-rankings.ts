import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getTodayDate(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function syncRankingsToShopCache(): Promise<{
  success: boolean;
  count: number;
}> {
  const today = getTodayDate();

  const allRankings = await prisma.shopRanking.findMany({
    where: { date: today },
    select: {
      shopId: true,
      score: true,
      type: true,
    },
  });

  if (allRankings.length === 0) {
    return { success: false, count: 0 };
  }

  await prisma.$transaction(
    allRankings.map((ranking) =>
      prisma.shop.update({
        where: { id: ranking.shopId },
        data: {
          [ranking.type === 'hot' ? 'cachedHotScore' : 'cachedHomeScore']:
            ranking.score,
        },
      }),
    ),
  );

  return { success: true, count: allRankings.length };
}

syncRankingsToShopCache();
