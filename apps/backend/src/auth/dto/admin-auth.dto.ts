import { AdminLevel } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

// 登入 / 接受邀請都改成 Google OAuth（見 GoogleAdminOAuthGuard + GoogleAdminStrategy），
// 不再需要 email/password 的 body，所以原本的 AdminLoginDto、AcceptAdminInviteDto 都拿掉了。

export class CreateAdminInviteDto {
  @IsEmail()
  email: string;

  // 現階段只開放 ORGANIZATION，但欄位先留著方便未來擴充
  @IsEnum(AdminLevel)
  level: AdminLevel;

  @IsOptional()
  @IsString()
  schoolId?: string;
}
