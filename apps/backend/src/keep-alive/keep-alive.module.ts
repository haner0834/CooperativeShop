import { Module } from '@nestjs/common';
import { KeepAliveService } from './keep-alive.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KeepAliveService],
})
export class KeepAliveModule {}
