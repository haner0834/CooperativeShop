import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopRankingService } from './shop-ranking.service';
import { Log } from 'src/common/decorators/logger.decorator';

@Injectable()
export class RankingScheduler {
  constructor(private shopRankingService: ShopRankingService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateHotRankings() {
    await this.shopRankingService.calculateAndUploadHotRankings();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateHomeRankings() {
    await this.shopRankingService.calculateAndUploadHomeRankings();
  }
}
