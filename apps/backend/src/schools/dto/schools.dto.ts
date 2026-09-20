import { Expose, Transform } from 'class-transformer';
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

  @IsString()
  @Expose()
  iconUrl: string;

  @IsUrl()
  @IsOptional()
  @Expose()
  websiteUrl: string | null;

  @IsNumber()
  @Expose()
  @Transform(({ obj }) => obj?._count?.shops ?? 0)
  shopsCount: number;

  @IsNumber()
  @Expose()
  @Transform(({ obj }) => obj?._count?.users ?? 0)
  usersCount: number;
}
