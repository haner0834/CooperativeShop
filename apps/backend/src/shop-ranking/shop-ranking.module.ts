import { Module } from '@nestjs/common';
import { ShopRankingService } from './shop-ranking.service';
import { ShopRankingController } from './shop-ranking.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ShopRankingController],
  providers: [ShopRankingService],
  exports: [ShopRankingService],
})
export class ShopRankingModule {}
