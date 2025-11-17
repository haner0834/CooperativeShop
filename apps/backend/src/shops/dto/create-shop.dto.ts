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

class ContactInfoDto implements ContactInfo {
  @IsEnum(ContactCategory)
  category: ContactCategory;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  href: string;
}

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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

  @IsOptional()
  @IsGoogleMapsUrl()
  googleMapsLink: string | null;

  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @IsUrl(undefined, { each: true })
  imageLinks: string[];

  @IsUrl()
  thumbnailLink: string;

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
}
