import { IsOptional, IsString } from 'class-validator';

export class DraftSearchQuery {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subtitle: string;
}
