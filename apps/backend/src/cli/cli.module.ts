import { Module } from '@nestjs/common';
import { ArchiveShopsCommand } from './commands/archive-shops.command';
import { ArchiveShopsService } from 'src/common/tasks/archive-shops.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FixDraftsCommand } from './commands/fix-drafts.command';
import { FixDraftsService } from 'src/common/tasks/fix-drafts.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { env } from 'src/common/utils/env.utils';

@Module({
  imports: [
    PrismaModule,
    RedisModule.forRoot({
      url: env('REDIS_URI'),
      type: 'single',
    }),
  ],
  providers: [
    ArchiveShopsCommand,
    ArchiveShopsService,
    FixDraftsCommand,
    FixDraftsService,
  ],
})
export class CliModule {}
