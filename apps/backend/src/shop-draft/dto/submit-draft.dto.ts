import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SubmitDraftDto {
  @IsString()
  draftId: string;
  @IsBoolean()
  @IsOptional()
  overwrite?: boolean;
}
