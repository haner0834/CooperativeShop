import { IsString, IsOptional } from 'class-validator';

export class RecordTapDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
