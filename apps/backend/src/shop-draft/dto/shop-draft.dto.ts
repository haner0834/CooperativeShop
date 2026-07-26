import { ReviewStatus, ShopDraftStage } from '@prisma/client';
import {
  Expose,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { TransformPrismaJsonArray } from 'src/common/decorators/transform-prisma-json-array.decorator';
import { ContactInfoDto, WorkScheduleDto } from 'src/shops/dto/create-shop.dto';

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// 定義 Status 的 Enum 或 Union 類型
export enum FileUploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error',
  DELETING = 'deleting',
}

class UploadInfoDto {
  @Expose()
  @IsString()
  fileKey: string;

  @Expose()
  @IsUrl()
  uploadUrl: string;

  @Expose()
  @IsString()
  thumbnailKey: string;

  @Expose()
  @IsUrl()
  thumbnailUploadUrl: string;
}

class SelectedImageDto {
  @Expose()
  @IsString()
  localId: string;

  @Expose()
  @IsOptional()
  @IsString()
  previewUrl: string | null;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => UploadInfoDto)
  uploadInfo?: UploadInfoDto;

  @Expose()
  @IsBoolean()
  isUploading: boolean;

  @Expose()
  @IsNumber()
  uploadProgress: number;

  @Expose()
  @IsEnum(FileUploadStatus)
  status: 'idle' | 'uploading' | 'success' | 'error' | 'deleting';

  @Expose()
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class ShopDraftVersionDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsNumber()
  versionNo: number;

  @Expose()
  @IsEnum(ReviewStatus)
  reviewStatus: ReviewStatus;

  @Expose()
  @IsOptional()
  @IsString()
  reviewerId: string;

  @Expose()
  @IsOptional()
  @Type(() => Date)
  submittedAt: Date;

  @Expose()
  @IsOptional()
  @Type(() => Date)
  reviewedAt: Date;

  @Expose()
  @IsOptional()
  @IsString()
  rejectReason?: string;
}

class SchoolInfoDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsOptional()
  @IsString()
  abbr: string;
}

export class ContractDto {
  @Expose()
  @IsString()
  fileName: string;

  @Expose()
  @IsNumber()
  fileSize: number;

  @Expose()
  @IsEnum(FileUploadStatus)
  status: 'idle' | 'uploading' | 'success' | 'error' | 'deleting';

  @Expose()
  @IsNumber()
  uploadProgress: number;

  @Expose()
  @IsOptional()
  @IsString()
  fileKey?: string;

  @Expose()
  @IsOptional()
  @IsUrl()
  uploadUrl?: string;

  @Expose()
  @IsOptional()
  errorMessage?: string;
}

export class ShopDraftDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @IsOptional()
  @IsString()
  shopId: string | null;

  @Expose()
  @IsString()
  title: string;

  @Expose()
  @IsOptional()
  @IsString()
  subtitle: string | null;

  @Expose()
  @IsString()
  normalizedKey: string;

  @Expose()
  @IsString()
  description: string;

  @Expose()
  @IsOptional()
  @IsString()
  discount: string | null;

  @Expose()
  @IsString()
  address: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  longitude: number | null;

  @Expose()
  @IsOptional()
  @IsNumber()
  latitude: number | null;

  @Expose()
  @IsString()
  thumbnailKey: string;

  @Expose()
  @IsEnum(ShopDraftStage)
  stage: ShopDraftStage;

  @Expose()
  @IsOptional()
  @Type(() => Date)
  reservedUntil: Date | null;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => ShopDraftVersionDto)
  currentVersion?: ShopDraftVersionDto;

  @Expose()
  @IsOptional()
  @Type(() => ContractDto)
  contract?: ContractDto;

  @Expose()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopDraftVersionDto)
  versions?: ShopDraftVersionDto[];

  @Expose()
  @TransformPrismaJsonArray(ContactInfoDto)
  @IsArray()
  @ValidateNested({ each: true })
  contactInfo: ContactInfoDto[];

  @Expose()
  @TransformPrismaJsonArray(SelectedImageDto)
  @IsArray()
  @ValidateNested({ each: true })
  images: SelectedImageDto[];

  @Expose()
  @TransformPrismaJsonArray(WorkScheduleDto)
  @IsArray()
  @ValidateNested({ each: true })
  workSchedules: WorkScheduleDto[];

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SchoolInfoDto)
  @Transform(({ obj, type }) => {
    if (type === TransformationType.PLAIN_TO_CLASS) {
      if (obj.school && typeof obj.school === 'object') {
        return {
          id: obj.school.id,
          abbr: obj.school.abbreviation,
        };
      }

      return {
        id: obj.schoolId,
        abbr: undefined,
      };
    }
    return undefined;
  })
  school?: SchoolInfoDto;
}
