import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

/**
 * @default uid 100
 * @default did 50
 * @default global 2000
 */
export interface RateLimitConfig {
  uid?: number;
  did?: number;
  global?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkAccess(
    ip: string,
    userId: string | null,
    deviceId: string | null,
    limitConfig?: RateLimitConfig,
  ): Promise<boolean> {
    const globalIpKey = `rl:ip:${ip}`;

    let targetKey = `rl:ip:${ip}:anon`;
    let targetLimit = 20;

    if (userId) {
      targetKey = `rl:user:${userId}`;
      targetLimit = limitConfig?.uid ?? 100;
    } else if (deviceId) {
      targetKey = `rl:did:${deviceId}`;
      targetLimit = limitConfig?.did ?? 50;

      // to prevent a ip appear with 1000 of fake device id
      const enumKey = `rl:enum:${ip}`;
      const distinctCound = await this.redis.sadd(enumKey, deviceId);
      if (distinctCound > 0) {
        await this.redis.expire(enumKey, 5 * 60);
      }

      const currentUniqueDevices = await this.redis.scard(enumKey);
      if (currentUniqueDevices > 300) {
        // 觸發防禦：封鎖此 IP
        await this.blockIp(ip, 60 * 60, 'Device ID Enumeration Attack');
        return false;
      }
    }

    const isBlocked = await this.redis.get(`rl:block:${ip}`);
    if (isBlocked) return false;

    // --- 執行 Lua Script 同時檢查 Global IP 和 Target Key ---
    // 邏輯：兩個 bucket 都 +1，如果任一個爆了就回傳 0 (失敗)
    const script = `
      local globalKey = KEYS[1]
      local targetKey = KEYS[2]
      local globalLimit = tonumber(ARGV[1])
      local targetLimit = tonumber(ARGV[2])

      local g = redis.call('INCR', globalKey)
      if g == 1 then redis.call('EXPIRE', globalKey, 60) end

      local t = redis.call('INCR', targetKey)
      if t == 1 then redis.call('EXPIRE', targetKey, 60) end

      if g > globalLimit or t > targetLimit then
        return 0
      else
        return 1
      end
    `;

    const result = await this.redis.eval(
      script,
      2,
      globalIpKey,
      targetKey,
      limitConfig?.global ?? 2000,
      targetLimit,
    );
    return result === 1;
  }

  async addRiskScore(ip: string, score: number) {
    const key = `rl:risk:${ip}`;
    const currentScore = await this.redis.incrby(key, score);
    await this.redis.expire(key, 5 * 60); // 風險值保留 5 分鐘

    // 累計錯誤超過閾值，直接封鎖
    if (currentScore >= 10) {
      await this.blockIp(ip, 10 * 60, 'Risk Score Exceeded');
    }
  }

  private async blockIp(ip: string, ttl: number, reason: string) {
    this.logger.warn(`Blocking IP ${ip} due to ${reason}`, { ip, ttl });
    await this.redis.set(`rl:block:${ip}`, '1', 'EX', ttl);
  }
}
