import { IdentifierType } from '@prisma/client';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const PROVIDERS: IdentifierType[] = ['USER', 'DEVICE_ID'];

export class RecordImpressionDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsIn(PROVIDERS)
  identifierType: string;

  @IsString()
  @IsNotEmpty()
  shopId: string;
}
