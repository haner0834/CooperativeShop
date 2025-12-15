import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsGoogleMapsUrl } from 'src/common/decorators/is-googlemaps-url.decorator';
import { ContactCategory, ContactInfo } from '../types/contact-info.type';
import { Weekday, WorkSchedule } from '../types/work-schedule.type';

export class ContactInfoDto implements ContactInfo {
  @IsEnum(ContactCategory)
  category: ContactCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  href: string;
}

export class WorkScheduleDto implements WorkSchedule {
  @IsEnum(Weekday)
  weekday: Weekday;

  @IsNumber()
  startMinuteOfDay: number;

  @IsNumber()
  endMinuteOfDay: number;
}

export class ImageDto {
  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  thumbnailKey: string;
}

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  subTitle?: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto[];

  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];

  @IsUrl()
  @IsString()
  @IsNotEmpty()
  thumbnailKey: string;

  @IsOptional()
  @IsString()
  discount: string | null;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsLongitude()
  @IsNumber()
  longitude: number;

  @IsLatitude()
  @IsNumber()
  latitude: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDto)
  schedules: WorkScheduleDto[];
}
