import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class RecordViewTimeDto {
  @IsString()
  shopId: string;

  @IsInt()
  @Min(1)
  duration: number; // in seconds

  @IsString()
  @IsOptional()
  deviceId?: string;
}
