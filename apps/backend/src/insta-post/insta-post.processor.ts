// instagram-post/instagram-post.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { INSTAGRAM_POST_QUEUE } from './insta-post.module';
import { PostPeerClient } from './postpeer.client';
import { CreateInstagramPostDto } from './dto/create-insta-post.dto';

@Processor(INSTAGRAM_POST_QUEUE, {
  concurrency: 5, // 同時處理的 job 數，依 PostPeer rate limit 調整
})
export class InstagramPostProcessor extends WorkerHost {
  private readonly logger = new Logger(InstagramPostProcessor.name);

  constructor(private readonly postPeerClient: PostPeerClient) {
    super();
  }

  async process(job: Job<CreateInstagramPostDto>) {
    const dto = job.data;
    this.logger.log(`Processing job ${job.id} for account ${dto.accountId}`);

    const result = await this.postPeerClient.createPost({
      content: dto.content,
      mediaItems: dto.mediaItems,
      platforms: [{ platform: 'instagram', accountId: dto.accountId }],
      publishNow: !dto.scheduledFor,
      scheduledFor: dto.scheduledFor,
      timezone: dto.timezone,
    });

    return result; // 存進 job.returnvalue，可在事件監聽器讀取
  }
}
