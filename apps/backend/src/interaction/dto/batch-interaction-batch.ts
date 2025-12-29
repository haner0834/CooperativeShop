import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionItemDto } from './record-interaction-item.dto';

export class BatchInteractionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteractionItemDto)
  interactions: InteractionItemDto[];

  @IsString()
  @IsOptional()
  deviceId?: string;
}
