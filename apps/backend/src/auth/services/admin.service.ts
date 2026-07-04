// src/auth/admin/admin.service.ts
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminContext } from '../types/admin-context.types';

const REDIS_HASH_KEY = 'admin:active_accounts';
const REDIS_INVALIDATE_CHANNEL = 'admin:invalidate';
const SAFETY_REFRESH_INTERVAL_MS = 60_000; // 保底輪詢，容忍最多 1 分鐘落差

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdminService.name);

  /** Guard 實際讀的地方：每個 process 自己的記憶體快取 */
  private localCache = new Map<string, AdminContext>();
  private refreshTimer?: NodeJS.Timeout;
  private initialLoad!: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDIS_SUBSCRIBER') private readonly redisSub: Redis,
  ) {}

  async onModuleInit() {
    this.initialLoad = this.warmUp();
    await this.initialLoad;

    await this.redisSub
      .subscribe(REDIS_INVALIDATE_CHANNEL)
      .catch((e) => this.logger.error('Subscribe admin channel failed', e));

    this.redisSub.on('message', (channel, accountId) => {
      if (channel === REDIS_INVALIDATE_CHANNEL) {
        this.applyInvalidation(accountId).catch((e) =>
          this.logger.warn(`Apply invalidation failed: ${accountId}`, e),
        );
      }
    });

    // 保底：漏推播或漏訂閱時，最多 1 分鐘自我修正
    this.refreshTimer = setInterval(() => {
      this.refreshFromDb().catch((e) =>
        this.logger.warn('Periodic admin cache refresh failed', e),
      );
    }, SAFETY_REFRESH_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  /** Guard 唯一需要呼叫的方法，永遠只讀 local memory */
  async getAdminContext(accountId: string): Promise<AdminContext | null> {
    await this.initialLoad; // 避免開機瞬間 cache 還沒熱身就誤判成 false
    return this.localCache.get(accountId) ?? null;
  }

  /**
   * 在升級/降級/停用 admin 的地方呼叫這個，
   * 讓所有 instance 立即同步，不用等 60 秒保底輪詢。
   */
  async invalidateAccount(accountId: string): Promise<void> {
    await this.applyInvalidation(accountId);
    await this.redis
      .publish(REDIS_INVALIDATE_CHANNEL, accountId)
      .catch((e) => this.logger.warn('Publish invalidate event failed', e));
  }

  private async applyInvalidation(accountId: string): Promise<void> {
    const ctx = await this.loadOneFromDb(accountId);

    if (ctx) {
      this.localCache.set(accountId, ctx);
      await this.redis
        .hset(REDIS_HASH_KEY, accountId, JSON.stringify(ctx))
        .catch((e) => this.logger.warn('Update redis hash failed', e));
    } else {
      this.localCache.delete(accountId);
      await this.redis
        .hdel(REDIS_HASH_KEY, accountId)
        .catch((e) => this.logger.warn('Delete from redis hash failed', e));
    }
  }

  private async warmUp(): Promise<void> {
    try {
      const all = await this.redis.hgetall(REDIS_HASH_KEY);
      if (all && Object.keys(all).length > 0) {
        this.localCache = new Map(
          Object.entries(all).map(([id, json]) => [
            id,
            JSON.parse(json) as AdminContext,
          ]),
        );
        return;
      }
      await this.refreshFromDb(); // Redis 是空的，可能第一次啟動
    } catch (e) {
      this.logger.error('Redis unavailable on warm-up, fallback to DB', e);
      await this.refreshFromDb();
    }
  }

  /** 全量重建：開機、保底輪詢、Redis 掛掉時都會用到 */
  private async refreshFromDb(): Promise<void> {
    const admins = await this.prisma.account.findMany({
      where: { role: 'ADMIN', admin: { isActive: true } },
      select: {
        id: true,
        adminId: true,
        admin: { select: { level: true, schoolId: true } },
      },
    });

    const next = new Map<string, AdminContext>();
    for (const a of admins) {
      if (!a.adminId || !a.admin) continue;
      next.set(a.id, {
        accountId: a.id,
        adminId: a.adminId,
        level: a.admin.level,
        schoolId: a.admin.schoolId,
      });
    }
    this.localCache = next;

    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(REDIS_HASH_KEY);
      for (const [accountId, ctx] of next) {
        pipeline.hset(REDIS_HASH_KEY, accountId, JSON.stringify(ctx));
      }
      await pipeline.exec();
    } catch (e) {
      this.logger.warn('Sync admin cache to redis failed', e);
    }
  }

  private async loadOneFromDb(accountId: string): Promise<AdminContext | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        role: true,
        adminId: true,
        admin: { select: { level: true, schoolId: true, isActive: true } },
      },
    });

    if (
      !account ||
      account.role !== 'ADMIN' ||
      !account.adminId ||
      !account.admin ||
      !account.admin.isActive
    ) {
      return null;
    }

    return {
      accountId: account.id,
      adminId: account.adminId,
      level: account.admin.level,
      schoolId: account.admin.schoolId,
    };
  }
}
