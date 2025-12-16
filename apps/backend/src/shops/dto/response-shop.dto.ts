import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactInfoDto, WorkScheduleDto } from './create-shop.dto';

export class ResponseImageDto {
  fileUrl: string;

  thumbnailUrl: string;
}

export class ResponseShopDto {
  @IsString()
  id: string; // 商店 ID

  @IsString()
  title: string;

  @IsString()
  subTitle: string | null;

  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto[];

  @IsString()
  schoolId: string;

  @IsString()
  schoolAbbr: string; // 從 School 關聯取得的縮寫

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseImageDto)
  images: ResponseImageDto[];

  @IsString()
  thumbnailLink: string; // 商店縮圖 URL

  @IsString()
  discount: string | null;

  @IsString()
  address: string;

  @IsNumber()
  longitude: number;

  @IsNumber()
  latitude: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDto)
  workSchedules: WorkScheduleDto[]; // 營業時間排程

  @IsString()
  googleMapsLink: string | null; // Google Maps 連結 (可選)
}
