import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { IsGoogleMapsUrl } from 'src/common/decorators/is-googlemaps-url.decorator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsPhoneNumber('TW', { each: true })
  phoneNumbers: string[];

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
