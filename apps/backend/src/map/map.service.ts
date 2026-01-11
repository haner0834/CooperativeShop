import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from 'src/common/utils/env.utils';

@Injectable()
export class MapService {
  DAILY_LIMIT = Number(env('SCHOOL_MAP_LIMIT'));
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async check(schoolId: string) {
    const today = new Date().toISOString().split('T')[0];
    const key = `rl:school:${schoolId}:map:${today}`;

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 24 * 60 * 60);
    }

    const remaining = Math.max(this.DAILY_LIMIT - current, 0);

    return {
      allowed: current <= this.DAILY_LIMIT,
      remaining,
    };
  }
}
