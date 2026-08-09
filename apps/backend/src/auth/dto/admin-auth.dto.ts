import { AdminLevel } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

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

export class AcceptAdminInviteDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
