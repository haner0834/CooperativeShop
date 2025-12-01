import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [InteractionController],
  providers: [InteractionService],
  imports: [AuthModule],
})
export class InteractionModule {}
