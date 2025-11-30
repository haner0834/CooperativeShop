import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopRankingService } from './shop-ranking.service';

@Injectable()
export class RankingScheduler {
  constructor(private shopRankingService: ShopRankingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async updateHotRankings() {
    await this.shopRankingService.calculateAndUploadHotRankings();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateHomeRankings() {
    await this.shopRankingService.calculateAndUploadHomeRankings();
  }
}
