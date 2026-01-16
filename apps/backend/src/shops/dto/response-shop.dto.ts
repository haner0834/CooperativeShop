import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContactInfoDto, WorkScheduleDto } from './create-shop.dto';

export class ResponseImageDto {
  @IsString()
  fileUrl: string;

  @IsString()
  thumbnailUrl: string | null;
}

export class ResponseShopDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsOptional()
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
  schoolAbbr: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseImageDto)
  images: ResponseImageDto[];

  @IsString()
  thumbnailLink: string;

  @IsOptional()
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
  workSchedules: WorkScheduleDto[];

  @IsOptional()
  @IsString()
  googleMapsLink: string | null;

  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsNumber()
  hotScore: number;

  @IsBoolean()
  @IsOptional()
  isSaved?: boolean = false;
}
