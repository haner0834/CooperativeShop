import { Expose } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class SchoolDTO {
  @IsString()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  name: string;

  @IsString()
  @Expose()
  abbreviation: string;

  @IsIn(['google', 'credential'])
  @Expose()
  loginMethod: string;

  @IsString()
  @IsOptional()
  @Expose()
  instagramAccount: string | null;

  @IsUrl()
  @IsOptional()
  @Expose()
  websiteUrl: string | null;

  @IsNumber()
  @Expose({ name: '_count.shops' })
  shopsCount: number;

  @IsNumber()
  @Expose({ name: '_count.users' })
  usersCount: number;
}
