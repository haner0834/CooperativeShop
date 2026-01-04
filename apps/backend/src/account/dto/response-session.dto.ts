import { Transform, Type } from 'class-transformer';
import { IsString, IsDate, IsBoolean } from 'class-validator';

export class ResponseSessionDto {
  @IsString()
  id: string;

  @IsString()
  deviceId: string;

  deviceType: string | null;

  @IsString()
  ipAddress: string | null;

  @IsString()
  browser: string | null;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  @Type(() => Date)
  @IsDate()
  expiresAt: Date | null;

  @IsString()
  userAgent: string | null;

  @IsString()
  country: string | null;

  @IsString()
  city: string | null;

  @IsBoolean()
  isCurrent: boolean;
}
