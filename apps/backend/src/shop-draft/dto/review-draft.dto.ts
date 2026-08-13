import { IsIn, IsOptional, IsString } from 'class-validator';
import { type ReviewResult } from '../types/review-result.types';

export class ReviewDraftDto {
  @IsIn(['APPROVE', 'REJECT'])
  result: ReviewResult;

  @IsString()
  @IsOptional()
  rejectReason?: string;
}
