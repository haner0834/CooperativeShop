import { Module } from '@nestjs/common';
import { SitemapService } from './site-map.service';
import { SitemapController } from './site-map.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 你的 PrismaModule

@Module({
  imports: [PrismaModule],
  providers: [SitemapService],
  controllers: [SitemapController],
})
export class SitemapModule {}
