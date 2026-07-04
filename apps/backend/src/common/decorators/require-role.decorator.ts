import { SetMetadata } from '@nestjs/common';
import { AccountRole, AdminLevel } from '@prisma/client';

export interface RequireRoleOptions {
  role: AccountRole;
  level?: AdminLevel;
}

export const REQUIRE_ROLE = 'requireRole';
export const RequireRole = (role: AccountRole = 'USER', level?: AdminLevel) =>
  SetMetadata(REQUIRE_ROLE, { role, level });
