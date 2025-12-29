import { IsString, IsEnum, IsInt, Min, IsOptional } from 'class-validator';

export class RecordImpressionDto {
  @IsString()
  shopId: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class BatchRecordImpressionDto {
  @IsString({ each: true })
  shopIds: string[];

  @IsString()
  @IsOptional()
  deviceId?: string;
}
