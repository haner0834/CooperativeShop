import { OmitType, PartialType, PickType } from '@nestjs/mapped-types'; // 或 @nestjs/swagger
import { IsString } from 'class-validator';
import { ShopDraftDto } from './shop-draft.dto'; // 引入你原本的完整 DTO

export class PatchShopDraftDto extends PartialType(
  PickType(ShopDraftDto, [
    'address',
    'contactInfo',
    'description',
    'discount',
    'images',
    'latitude',
    'longitude',
    'contract',
    'thumbnailKey',
    'workSchedules',
    'submissionNote',
  ]),
) {
  @IsString()
  id: string;
}
