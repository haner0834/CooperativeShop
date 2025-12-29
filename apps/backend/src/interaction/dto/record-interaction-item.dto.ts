import { IsString, IsEnum, IsInt, Min, IsOptional } from 'class-validator';

export enum InteractionType {
  IMPRESSION = 'impressionCount',
  VIEW = 'viewCount',
  TAP = 'tapCount',
  VIEW_TIME = 'viewTimeSec',
}

export class InteractionItemDto {
  @IsString()
  shopId: string;

  @IsEnum(InteractionType)
  type: InteractionType;

  @IsInt()
  @Min(1)
  @IsOptional()
  value?: number = 1; // 預設為 1，viewTimeSec 則會傳入實際秒數
}
