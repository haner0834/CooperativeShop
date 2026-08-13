import { ReviewStatus, ShopDraftStage } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

export class DraftFilterOptions {
  @IsOptional()
  @IsIn(['RESERVED', 'EDITING', 'SUBMITTED', 'ARCHIVED', 'APPROVED'])
  stage?: ShopDraftStage;

  @IsOptional()
  @IsEnum(ReviewStatus)
  reviewStatus?: ReviewStatus;

  @IsOptional()
  @IsString()
  schoolAbbr?: string;
}
