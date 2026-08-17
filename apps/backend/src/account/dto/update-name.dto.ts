import { IsString } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  newName: string;
}
