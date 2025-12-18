import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopRankingService } from './shop-ranking.service';
import { Log } from 'src/common/decorators/logger.decorator';

@Injectable()
export class RankingScheduler {
  constructor(private shopRankingService: ShopRankingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  @Log({ logReturn: false })
  async updateHotRankings() {
    await this.shopRankingService.calculateAndUploadHotRankings();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  @Log({ logReturn: false })
  async updateHomeRankings() {
    await this.shopRankingService.calculateAndUploadHomeRankings();
  }
}
