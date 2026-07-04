import { AdminLevel } from '@prisma/client';

export interface AdminContext {
  accountId: string;
  adminId: string;
  level: AdminLevel;
  schoolId: string | null;
}
