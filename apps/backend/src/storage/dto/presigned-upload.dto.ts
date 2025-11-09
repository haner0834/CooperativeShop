import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Max,
} from 'class-validator';

export enum FileCategory {
  AVATAR = 'avatar',
  SHOP_IMAGE = 'shop-image',
  SHOP_THUMBNAIL = 'shop-thumbnail',
  IMAGE_THUMBNAIL = 'image-thumbnail',
}

export class GeneratePresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsEnum(FileCategory)
  category: FileCategory;

  @IsNumber()
  @IsOptional()
  @Max(5 * 1024 * 1024)
  fileSize?: number;
}

export class ConfirmUploadDto {
  @IsString()
  @IsNotEmpty()
  fileKey: string; // 上傳時使用的 key

  @IsString()
  @IsNotEmpty()
  thumbnailKey: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;
}
