import { Module } from '@nestjs/common';
import { ShopDraftService } from './services/shop-draft.service';
import { ShopDraftController } from './controllers/shop-draft.controller';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { ShopDraftReviewService } from './services/shop-draft-review.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiReviewModule } from 'src/ai-review/ai-review.module';
import { InstaPostModule } from 'src/insta-post/insta-post.module';
import { ShopsModule } from 'src/shops/shops.module';
import { AdminShopDraftController } from './controllers/admin-shop-draft.controller';

@Module({
  controllers: [ShopDraftController, AdminShopDraftController],
  providers: [ShopDraftService, ShopDraftLockService, ShopDraftReviewService],
  imports: [
    AuthModule,
    PrismaModule,
    AiReviewModule,
    InstaPostModule,
    ShopsModule,
  ],
})
export class ShopDraftModule {}
