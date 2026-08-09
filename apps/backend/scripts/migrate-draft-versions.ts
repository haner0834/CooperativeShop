import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 開始清理 ReviewStatus 舊資料...');

  // 將所有舊有的 Enum 值統一更新為 IDLE
  const result = await prisma.shopDraftVersion.updateMany({
    where: {
      reviewStatus: {
        in: ['PROCESSING', 'AI_REJECT', 'AI_APPROVED'] as any,
      },
    },
    data: {
      reviewStatus: 'IDLE',
    },
  });

  console.log(`✅ 清理完成！共更新了 ${result.count} 筆資料。`);
}

main()
  .catch((e) => {
    console.error('❌ 資料更新失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
