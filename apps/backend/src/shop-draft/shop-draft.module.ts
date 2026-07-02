import { Module } from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';
import { ShopDraftController } from './shop-draft.controller';

@Module({
  controllers: [ShopDraftController],
  providers: [ShopDraftService],
})
export class ShopDraftModule {}
