import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class MediaItemDto {
  @IsIn(['image', 'video'])
  type: 'image' | 'video';

  @IsString()
  url: string;
}

export class CreateInstagramPostDto {
  @IsString()
  accountId: string; // PostPeer 上已連接好的 IG accountId

  @IsString()
  content: string; // caption

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  mediaItems: MediaItemDto[];

  @IsOptional()
  @IsString()
  scheduledFor?: string; // ISO time，若不給則立即發

  @IsOptional()
  @IsString()
  timezone?: string;
}
