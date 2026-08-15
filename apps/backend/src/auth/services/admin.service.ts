// src/auth/services/admin.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminContext } from '../types/admin-context.types';
import { AdminListItem } from '../types/admin-auth.types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { AdminLevel } from '@prisma/client';

const REDIS_HASH_KEY = 'admin:active_accounts';
const SAFETY_REFRESH_INTERVAL_MS = 60_000; // 保底輪詢，容忍最多 1 分鐘落差

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdminService.name);

  /** Guard 實際讀的地方：每個 process 自己的記憶體快取，key 是 accountId */
  private localCache = new Map<string, AdminContext>();
  private refreshTimer?: NodeJS.Timeout;
  private initialLoad!: Promise<void>;

  private subscriber!: Redis;

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

    this.subscriber = this.redis.duplicate();

    // 2. 訂閱此 Hash 鍵的事件通道
    // Redis 會將該 Key 的動作推播到 __keyspace@0__:admin:active_accounts
    const channelName = `__keyspace@0__:${REDIS_HASH_KEY}`;
    await this.subscriber
      .subscribe(channelName)
      .catch((e) => this.logger.error(`Subscribe to ${channelName} failed`, e));

    // 3. 監聽訊息（當 Redis 資料有變動時，訊息內容會是動作名稱，如 "hset", "hdel", "del"）
    this.subscriber.on('message', (channel, action) => {
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
   * 在升級/降級/停用單一 Account 的地方呼叫這個，
   * 這裡只負責直接改 Redis，改完後 Redis 的通知機制會觸發所有服務的訊息監聽。
   *
   * 注意：這個方法只處理「一筆 accountId」。一個 admin 底下可能有多筆 Account
   * （Admin.account 是 Account[]，例如同時有 credentials + google 兩種登入方式），
   * 如果是「整個 admin」層級的異動（停權、復權、調整 level），
   * 要呼叫下面的 invalidateAdmin，讓所有登入方式的 cache 一起刷新——
   * 只呼叫 invalidateAccount 只會刷新到剛好操作的那一筆 accountId，
   * 其他 accountId 要等最多 60 秒的保底輪詢才會跟著失效，這段空窗期是安全性風險。
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

  /**
   * 讓一個 admin「名下所有」Account（所有登入方式）的 cache 一起失效。
   * deactivate / reactivate / 調整 level 都是 admin 層級的異動，一定要呼叫這個，
   * 不要只呼叫 invalidateAccount，理由見上面的註解。
   */
  async invalidateAdmin(adminId: string): Promise<void> {
    const accounts = await this.prisma.account.findMany({
      where: { adminId, role: 'ADMIN' },
      select: { id: true },
    });

    await Promise.all(accounts.map((a) => this.invalidateAccount(a.id)));
  }

  /**
   * 停用一個 admin（不刪除資料，只是關閉權限）。
   * 呼叫完會立刻讓所有登入方式、所有 process 的快取失效，
   * guard 下一次請求就會擋下來，不管對方是用哪一種方式登入的。
   */
  async deactivateAdmin(adminId: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { isActive: false },
    });

    await this.invalidateAdmin(adminId);
  }

  /**
   * 重新啟用一個先前被停用的 admin。
   */
  async reactivateAdmin(adminId: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { isActive: true },
    });

    await this.invalidateAdmin(adminId);
  }

  /**
   * 調整 admin 的 level（目前系統只會用到 ORGANIZATION，
   * 但方法先做好，school level admin 上線時可以直接用）。
   */
  async updateAdminLevel(
    adminId: string,
    level: AdminLevel,
    schoolId: string | null = null,
  ): Promise<void> {
    await this.prisma.admin.update({
      where: { id: adminId },
      data: { level, schoolId },
    });

    await this.invalidateAdmin(adminId);
  }

  /**
   * 給 admin console 「成員列表」頁用，回傳所有 admin（含停用的）。
   *
   * 從 Admin 表出發、把 account 當 relation 帶出來，而不是從 Account 表出發，
   * 是刻意的——一個 admin 可能有多筆 Account（多種登入方式），
   * 從 Account 表出發會讓同一個人在列表上重複出現。
   */
  async listAdmins(): Promise<AdminListItem[]> {
    const admins = await this.prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        schoolId: true,
        isActive: true,
        lastLoginAt: true,
        createAt: true,
        accounts: {
          where: { role: 'ADMIN' },
          select: { provider: true },
        },
      },
    });

    return admins
      .map((a) => ({
        adminId: a.id,
        name: a.name,
        email: a.email,
        level: a.level,
        schoolId: a.schoolId,
        isActive: a.isActive,
        lastLoginAt: a.lastLoginAt,
        createAt: a.createAt,
        linkedProviders: a.accounts.map((acc) => acc.provider),
      }))
      .sort((x, y) => y.createAt.getTime() - x.createAt.getTime());
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

  /**
   * 全量重建：開機、保底輪詢、Redis 掛掉時都會用到。
   * 一律以 accountId 為 key，一個 admin 有幾筆 Account 就會有幾筆 cache entry，
   * 內容（level/schoolId 等）都相同，只有 accountId 不同——
   * 這樣不管 JWT 裡帶的是哪一個登入方式的 accountId 都查得到。
   */
  private async refreshFromDb(): Promise<void> {
    const accounts = await this.prisma.account.findMany({
      where: { role: 'ADMIN', admin: { isActive: true } },
      select: {
        id: true,
        adminId: true,
        admin: { select: { level: true, schoolId: true } },
      },
    });

    const next = new Map<string, AdminContext>();
    for (const a of accounts) {
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
