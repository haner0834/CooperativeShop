import { IsOptional, IsString, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ShopSortBy {
  HOT = 'hot',
  HOME = 'home',
  DISTANCE = 'nearby',
}

export class GetShopsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  schoolAbbr?: string;

  @IsOptional()
  @IsEnum(ShopSortBy)
  sortBy?: ShopSortBy = ShopSortBy.HOME;

  // 經緯度參數 (全選填)
  @IsOptional() @Type(() => Number) minLat?: number;
  @IsOptional() @Type(() => Number) maxLat?: number;
  @IsOptional() @Type(() => Number) minLng?: number;
  @IsOptional() @Type(() => Number) maxLng?: number;
  @IsOptional() @Type(() => Number) userLat?: number;
  @IsOptional() @Type(() => Number) userLng?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsBoolean()
  isSaved?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;
}
