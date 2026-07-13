import { ReviewStatus, ShopDraftStage } from '@prisma/client';
import {
  Expose,
  plainToInstance,
  Transform,
  TransformationType,
  Type,
} from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
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

class UploadInfoDto {
  @Expose() fileKey: string;

  @Expose() uploadUrl: string;

  @Expose() thumbnailKey: string;

  @Expose() thumbnailUploadUrl: string;
}

class SelectedImageDto {
  @Expose() localId: string;

  @Expose() previewUrl: string | null;

  @Expose() uploadInfo?: UploadInfoDto;

  @Expose() isUploading: boolean;

  @Expose() uploadProgress: number;

  @Expose() status: 'idle' | 'uploading' | 'success' | 'error' | 'deleting';

  @Expose() errorMessage?: string;
}

export class ShopDraftVersionDto {
  @Expose() id: string;
  @Expose() versionNo: number;
  @Expose() reviewStatus: ReviewStatus;
  @Expose() reviewerId: string;
  @Expose() submittedAt: Date;
  @Expose() reviewedAt: Date;
  @Expose() rejectReason?: string;
}

class SchoolInfoDto {
  @Expose() id: string;
  @Expose() abbr: string;
}

export class ShopDraftDto {
  @Expose() id: string;

  @Expose() @Type(() => Date) createdAt: Date;

  @Expose() @Type(() => Date) updatedAt: Date;

  @Expose() shopId: string | null;

  @Expose() title: string;

  @Expose() subtitle: string | null;

  @Expose() normalizedKey: string;

  @Expose() description: string;

  @Expose() discount: string | null;

  @Expose() address: string;

  @Expose() longitude: number | null;

  @Expose() latitude: number | null;

  @Expose() thumbnailKey: string;

  @Expose() stage: ShopDraftStage;

  @Expose() @Type(() => Date) reservedUntil: Date | null;

  @Expose()
  @Type(() => ShopDraftVersionDto)
  currentVersion?: ShopDraftVersionDto;

  @Expose()
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
