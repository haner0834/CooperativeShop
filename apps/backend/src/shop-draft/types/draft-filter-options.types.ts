import { ShopDraftStage } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

export class DraftFilterOptions {
  @IsOptional()
  stage?: ShopDraftStage;

  @IsOptional()
  @IsString()
  schoolAbbr?: string;
}
