import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InteractionService } from './interaction.service';
import { Log } from 'src/common/decorators/logger.decorator';

@Injectable()
export class InteractionScheduler {
  constructor(private interactionService: InteractionService) {}

  /**
   * Clean up old interaction data daily at 3:00 AM
   * Deletes data older than 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  @Log()
  async cleanupOldInteractions() {
    const remainingDays = 7;
    await this.interactionService.cleanupOldUserInteractions(remainingDays);
  }
}
