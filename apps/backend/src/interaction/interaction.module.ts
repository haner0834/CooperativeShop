import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { AuthModule } from 'src/auth/auth.module';
import { InteractionScheduler } from './interaction.cron';

@Module({
  controllers: [InteractionController],
  providers: [InteractionService, InteractionScheduler],
  imports: [AuthModule],
})
export class InteractionModule {}
