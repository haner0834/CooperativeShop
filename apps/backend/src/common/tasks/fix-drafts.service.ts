import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopDraftStage } from '@prisma/client';

@Injectable()
export class FixDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async clearRedisDraftLocks(): Promise<number> {
    const keys = await this.redis.keys('draft-lock:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    return keys.length;
  }

  async fixDraftStages(options: {
    ids?: string[];
    targetStage: ShopDraftStage;
  }): Promise<number> {
    const { ids, targetStage } = options;

    const whereCondition =
      ids && ids.length > 0
        ? { id: { in: ids } }
        : { stage: 'EDITING' as ShopDraftStage };

    const result = await this.prisma.shopDraft.updateMany({
      where: whereCondition,
      data: {
        stage: targetStage,
      },
    });

    return result.count;
  }
}
