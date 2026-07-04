import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'node_modules/class-validator/types';

export class SubmitDraftDto {
  @IsString()
  draftId: string;
  @IsBoolean()
  @IsOptional()
  overwrite?: boolean;
}
