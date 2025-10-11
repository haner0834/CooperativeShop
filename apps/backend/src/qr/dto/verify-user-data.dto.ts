import { IsString } from 'class-validator';

export class VerifyUserQrDto {
  @IsString()
  data: string;
}
