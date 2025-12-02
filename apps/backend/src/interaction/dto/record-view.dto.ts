import { IsString, IsOptional } from 'class-validator';

export class RecordViewDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
