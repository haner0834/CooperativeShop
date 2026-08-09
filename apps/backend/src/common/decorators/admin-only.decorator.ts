import { applyDecorators, UseGuards } from '@nestjs/common';
import { AdminLevel } from '@prisma/client';
import { JwtAdminGuard } from 'src/auth/guards/jwt-admin.guard';

export function AdminOnly(level?: AdminLevel) {
  // set role restriction when opening school level and need specification
  return applyDecorators(UseGuards(JwtAdminGuard));
}
