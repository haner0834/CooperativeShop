// src/auth/admin/admin.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminContext } from '../types/admin-context.types';
import { InjectRedis } from '@nestjs-modules/ioredis';

const REDIS_HASH_KEY = 'admin:active_accounts';
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
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    this.initialLoad = this.warmUp();
    await this.initialLoad;

    // 1. 啟用 Redis 的鍵空間通知 (Key-space Notifications)
    // 'g' 代表啟用一般命令（例如 DEL, HSET），'h' 代表啟用 Hash 類型命令
    await this.redis
      .config('SET', 'notify-keyspace-events', 'gh')
      .catch((e) =>
        this.logger.warn('Failed to set Redis config for notifications', e),
      );

    // 2. 訂閱此 Hash 鍵的事件通道
    // Redis 會將該 Key 的動作推播到 __keyspace@0__:admin:active_accounts
    const channelName = `__keyspace@0__:${REDIS_HASH_KEY}`;
    await this.redis
      .subscribe(channelName)
      .catch((e) => this.logger.error(`Subscribe to ${channelName} failed`, e));

    // 3. 監聽訊息（當 Redis 資料有變動時，訊息內容會是動作名稱，如 "hset", "hdel", "del"）
    this.redis.on('message', (channel, action) => {
      if (channel === channelName) {
        this.logger.log(
          `Redis cache changed via action: ${action}. Refreshing local cache...`,
        );
        // 當遠端有變動時，重新同步一次本機快取
        this.syncLocalCacheFromRedis().catch((e) =>
          this.logger.warn('Sync local cache from Redis failed', e),
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
    await this.initialLoad;
    return this.localCache.get(accountId) ?? null;
  }

  /**
   * 在升級/降級/停用 admin 的地方呼叫這個，
   * 這裡只負責直接改 Redis，改完後 Redis 的通知機制會觸發所有服務的訊息監聽
   */
  async invalidateAccount(accountId: string): Promise<void> {
    const ctx = await this.loadOneFromDb(accountId);

    if (ctx) {
      await this.redis
        .hset(REDIS_HASH_KEY, accountId, JSON.stringify(ctx))
        .catch((e) => this.logger.warn('Update redis hash failed', e));
    } else {
      await this.redis
        .hdel(REDIS_HASH_KEY, accountId)
        .catch((e) => this.logger.warn('Delete from redis hash failed', e));
    }
  }

  private async warmUp(): Promise<void> {
    try {
      await this.syncLocalCacheFromRedis();
    } catch (e) {
      this.logger.error('Redis unavailable on warm-up, fallback to DB', e);
      await this.refreshFromDb();
    }
  }

  /** 從 Redis 讀取最新狀態並蓋掉 Local Cache */
  private async syncLocalCacheFromRedis(): Promise<void> {
    const all = await this.redis.hgetall(REDIS_HASH_KEY);
    if (all && Object.keys(all).length > 0) {
      this.localCache = new Map(
        Object.entries(all).map(([id, json]) => [
          id,
          JSON.parse(json) as AdminContext,
        ]),
      );
    } else {
      // 如果 Redis 是空的，有可能是第一次啟動，改從 DB 撈
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
