import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
/**
 * 將 Enum Weekday 轉換為 Prisma 中建議使用的 Int (0-6)
 * 這樣做是為了方便 Date.getDay() 直接比對，且效能最佳
 */
const WeekdayToInt: Record<Weekday, number> = {
  ['SUN']: 0,
  ['MON']: 1,
  ['TUE']: 2,
  ['WED']: 3,
  ['THU']: 4,
  ['FRI']: 5,
  ['SAT']: 6,
};

async function migrate() {
  console.log('🚀 開始遷移營業時間資料 (JSON -> WorkSchedule Table)...');

  // 1. 取得所有商店
  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      title: true,
      schedules: true, // 舊的 JSON 欄位
    },
  });

  console.log(`找到 ${shops.length} 間商店待處理。`);

  for (const shop of shops) {
    // 2. 解析 JSON 內容
    // 根據您的 WorkSchedule interface: { weekday: Weekday, startMinuteOfDay: number, endMinuteOfDay: number }
    const oldSchedules = shop.schedules as any[];

    if (!Array.isArray(oldSchedules) || oldSchedules.length === 0) {
      console.log(`⚠️  商店 [${shop.title}] 沒有設定營業時間，略過。`);
      continue;
    }

    try {
      // 3. 轉換為新模型的資料格式
      const newSchedulesData = oldSchedules.map((s) => ({
        shopId: shop.id,
        dayOfWeek: WeekdayToInt[s.weekday as Weekday], // 轉為 0-6
        startMinute: s.startMinuteOfDay,
        endMinute: s.endMinuteOfDay,
      }));

      // 4. 寫入資料庫 (使用 Transaction 確保一致性)
      await prisma.$transaction(async (tx) => {
        // 先刪除該商店可能已存在的新排程 (防止重複執行腳本時報錯)
        await tx.workSchedule.deleteMany({
          where: { shopId: shop.id },
        });

        // 批次寫入新排程
        await tx.workSchedule.createMany({
          data: newSchedulesData,
        });
      });

      console.log(
        `✅ 商店 [${shop.title}] 遷移完成 (${newSchedulesData.length} 筆時段)`,
      );
    } catch (err) {
      console.error(`❌ 商店 [${shop.title}] 遷移失敗:`, err.message);
    }
  }

  console.log('\n✨ 遷移工作全部完成！');
}

migrate()
  .catch((e) => {
    console.error('致命錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
