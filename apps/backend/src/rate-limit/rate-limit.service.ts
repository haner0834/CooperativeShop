import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { env } from 'src/common/utils/env.utils';
import * as crypto from 'crypto';

/**
 * @default uid 100
 * @default did 50
 * @default global 2000
 */
export interface RateLimitConfig {
  uid?: number;
  did?: number;
  global?: number;
  isolateScope?: string; // Add this
}

export enum TrustLevel {
  UNTRUSTED = 0, // No ID
  DEVICE_HEADER = 1, // Header only (Unverified)
  DEVICE_COOKIE = 2, // Cookie Verified
  AUTHENTICATED = 3, // User Logged in
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkAccess(
    ip: string,
    userId: string | null,
    deviceId: string | null,
    trustLevel: TrustLevel,
    limitConfig?: RateLimitConfig,
  ): Promise<boolean> {
    const scope = limitConfig?.isolateScope
      ? `:${limitConfig.isolateScope}`
      : '';

    // 1. 定義 Global IP Key (加上 scope 區隔)
    // 如果是 Auth API (有 scope)，我們通常希望它的 IP 限制是獨立的，或者你可以選擇共用
    // 這裡示範：Scope 存在時，Global 限制也是獨立的 (防止 Auth 攻擊影響一般瀏覽)
    const globalIpKey = `rl:ip:${ip}${scope}`;

    // 2. 根據 TrustLevel 動態決定 Global Limit
    let dynamicGlobalLimit = limitConfig?.global ?? 2000;

    // 如果沒有特定設定，則套用預設的階層限制
    if (!limitConfig?.global) {
      switch (trustLevel) {
        case TrustLevel.UNTRUSTED:
          dynamicGlobalLimit = 20; // 嚴格限制 Bot
          break;
        case TrustLevel.DEVICE_HEADER:
          dynamicGlobalLimit = 100; // 只有 Header，尚未信任
          break;
        case TrustLevel.DEVICE_COOKIE:
          dynamicGlobalLimit = 500; // 已驗證裝置
          break;
        case TrustLevel.AUTHENTICATED:
          dynamicGlobalLimit = 2000; // 登入用戶
          break;
      }
    }

    // 3. 決定 Target Key (針對 User 或 Device 的個別限制)
    let targetKey = `rl:ip:${ip}:anon${scope}`;
    let targetLimit = 20; // Default anonymous limit inside the scope

    if (userId) {
      targetKey = `rl:user:${userId}${scope}`;
      targetLimit = limitConfig?.uid ?? 300;
    } else if (deviceId) {
      targetKey = `rl:did:${deviceId}${scope}`;
      targetLimit = limitConfig?.did ?? 150;

      // 只在非 Scope 的情況下檢查 Device 枚舉攻擊 (避免 Auth API 誤判)
      if (!scope && trustLevel <= TrustLevel.DEVICE_HEADER) {
        await this.checkDeviceEnumeration(ip, deviceId);
      }
    }

    // 4. 檢查 IP Block
    const isBlocked = await this.redis.get(`rl:block:${ip}`);
    if (isBlocked) return false;

    // 5. 執行 Lua
    return this.execRateLimitScript(
      globalIpKey,
      targetKey,
      dynamicGlobalLimit,
      targetLimit,
    );
  }

  private async checkDeviceEnumeration(ip: string, deviceId: string) {
    const enumKey = `rl:enum:${ip}`;
    const distinctCount = await this.redis.sadd(enumKey, deviceId);
    if (distinctCount > 0) {
      await this.redis.expire(enumKey, 5 * 60);
    }
    const currentUniqueDevices = await this.redis.scard(enumKey);
    if (currentUniqueDevices > 100) {
      await this.blockIp(ip, 60 * 60, 'Device ID Enumeration Attack');
    }
  }

  private async execRateLimitScript(
    gKey: string,
    tKey: string,
    gLimit: number,
    tLimit: number,
  ): Promise<boolean> {
    const script = `
      local gKey = KEYS[1]
      local tKey = KEYS[2]
      local gLimit = tonumber(ARGV[1])
      local tLimit = tonumber(ARGV[2])

      local g = redis.call('INCR', gKey)
      if g == 1 then redis.call('EXPIRE', gKey, 60) end

      local t = redis.call('INCR', tKey)
      if t == 1 then redis.call('EXPIRE', tKey, 60) end

      if g > gLimit or t > tLimit then
        return 0
      else
        return 1
      end
    `;
    const result = await this.redis.eval(script, 2, gKey, tKey, gLimit, tLimit);
    return result === 1;
  }

  async addRiskScore(ip: string, score: number) {
    const key = `rl:risk:${ip}`;
    const currentScore = await this.redis.incrby(key, score);
    await this.redis.expire(key, 5 * 60); // 風險值保留 5 分鐘

    // 累計錯誤超過閾值，直接封鎖
    if (currentScore >= 16) {
      await this.blockIp(ip, 10 * 60, 'Risk Score Exceeded');
    }
  }

  async checkSchoolQuota(
    schoolAbbr: string,
    dailyLimit: number = 150,
  ): Promise<{
    allowed: boolean;
    remaining: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `rl:school:${schoolAbbr}:shop:${today}`;

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 24 * 60 * 60);
    }

    const remaining = Math.max(dailyLimit - current, 0);

    return {
      allowed: current <= dailyLimit,
      remaining,
    };
  }

  private async blockIp(ip: string, ttl: number, reason: string) {
    this.logger.warn(`Blocking IP ${ip} due to ${reason}`, { ip, ttl });
    await this.redis.set(`rl:block:${ip}`, '1', 'EX', ttl);
  }
}
