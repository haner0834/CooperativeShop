import { Module } from '@nestjs/common';
import { InstaPostService } from './insta-post.service';
import { InstaPostController } from './insta-post.controller';
import { BullModule } from '@nestjs/bullmq';
import { InstagramPostProcessor } from './insta-post.processor';
import { PostPeerClient } from './postpeer.client';

export const INSTAGRAM_POST_QUEUE = 'insta-post';

@Module({
  imports: [
    BullModule.registerQueue({
      name: INSTAGRAM_POST_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  ],
  controllers: [InstaPostController],
  providers: [InstaPostService, InstagramPostProcessor, PostPeerClient],
  exports: [InstaPostService],
})
export class InstaPostModule {}
