import { Module } from '@nestjs/common';
import { ShopRankingService } from './shop-ranking.service';
import { ShopRankingController } from './shop-ranking.controller';

@Module({
  controllers: [ShopRankingController],
  providers: [ShopRankingService],
})
export class ShopRankingModule {}
