import { WorkSchedule, FileRecord } from '@prisma/client';
import { Shop as PrismaShop } from '@prisma/client';

export type ShopWithRelations = PrismaShop & {
  school: { abbreviation: string };
  workSchedules: WorkSchedule[];
  images: { file: FileRecord }[];
  _count?: {
    savedBy: number;
  };
};
