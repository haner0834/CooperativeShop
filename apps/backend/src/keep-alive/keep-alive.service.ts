import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class KeepAliveService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/25 * * * * *') // every 25 seconds
  async keepAlive() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {}
  }
}
