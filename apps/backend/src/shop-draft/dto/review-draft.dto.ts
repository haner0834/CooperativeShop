import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewDraftDto {
  @IsIn(['SUCCESS', 'REJECT'])
  result: 'SUCCESS' | 'REJECT';

  @IsString()
  @IsOptional()
  rejectReason?: string;
}
