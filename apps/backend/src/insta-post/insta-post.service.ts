// instagram-post/instagram-post.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INSTAGRAM_POST_QUEUE } from './insta-post.module';
import { CreateInstagramPostDto } from './dto/create-insta-post.dto';

@Injectable()
export class InstaPostService {
  constructor(
    @InjectQueue(INSTAGRAM_POST_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * 供其他模組呼叫：把一篇 IG 貼文加入發文佇列
   */
  async schedulePost(dto: CreateInstagramPostDto) {
    const job = await this.queue.add('publish-instagram-post', dto, {
      jobId: `ig-${dto.accountId}-${Date.now()}`,
    });
    return { jobId: job.id };
  }

  /**
   * 供其他模組查詢 job 狀態
   */
  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      jobId: job.id,
      state, // 'waiting' | 'active' | 'completed' | 'failed' | ...
      attemptsMade: job.attemptsMade,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
