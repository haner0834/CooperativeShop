import { ShopDraftStage } from '@prisma/client';
import { IsOptional, IsString } from 'node_modules/class-validator/types';

export class DraftFilterOptions {
  @IsOptional()
  stage?: ShopDraftStage;

  @IsOptional()
  @IsString()
  schoolAbbr?: string;
}
