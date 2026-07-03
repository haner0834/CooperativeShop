import { Module } from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';
import { ShopDraftController } from './shop-draft.controller';
import { ShopDraftLockService } from './services/shop-draft-lock.service';

@Module({
  controllers: [ShopDraftController],
  providers: [ShopDraftService, ShopDraftLockService],
})
export class ShopDraftModule {}
