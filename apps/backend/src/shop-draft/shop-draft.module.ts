import { Module } from '@nestjs/common';
import { ShopDraftService } from './services/shop-draft.service';
import { ShopDraftController } from './shop-draft.controller';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { ShopDraftReviewService } from './services/shop-draft-review.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ShopDraftController],
  providers: [ShopDraftService, ShopDraftLockService, ShopDraftReviewService],
  imports: [AuthModule, PrismaModule],
})
export class ShopDraftModule {}
