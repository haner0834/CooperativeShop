import { Module } from '@nestjs/common';
import { ArchiveShopsCommand } from './commands/archive-shops.command';
import { ArchiveShopsService } from 'src/common/tasks/archive-shops.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ArchiveShopsCommand, ArchiveShopsService],
})
export class CliModule {}
