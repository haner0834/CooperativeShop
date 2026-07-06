import { ReviewStatus, ShopDraftStage } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
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

  @Expose() currentVersion?: ShopDraftVersionDto | null;

  @Expose() versions?: ShopDraftVersionDto[] = [];

  @Expose() shopId: string | null;

  @Expose() title: string;

  @Expose() subtitle: string | null;

  @Expose() normalizedKey: string;

  @Expose() description: string;

  @Expose() @Type(() => ContactInfoDto) contactInfo: ContactInfoDto[];

  @Expose() discount: string | null;

  @Expose() @Type(() => WorkScheduleDto) workSchedules: WorkScheduleDto[];

  @Expose() address: string;

  @Expose() longitude: number;

  @Expose() latitude: number;

  @Expose() thumbnailKey: string;

  @Expose() @Type(() => SelectedImageDto) images: SelectedImageDto[];

  @Expose() @Type(() => SchoolInfoDto) school: SchoolInfoDto;

  @Expose() stage: ShopDraftStage;

  @Expose() @Type(() => Date) reservedUntil: Date | null;
}
