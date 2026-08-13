import { Module } from '@nestjs/common';
import { InstaPostService } from './insta-post.service';
import { InstaPostController } from './insta-post.controller';
import { BullModule } from '@nestjs/bullmq';
import { InstagramPostProcessor } from './insta-post.processor';
import { PostPeerClient } from './postpeer.client';
import { INSTAGRAM_POST_QUEUE } from './insta-post.constants';
import { InstaPostImageModule } from 'src/insta-post-image/insta-post-image.module';
import { StorageModule } from 'src/storage/storage.module';
import { InstaPostSequenceService } from './insta-post-sequence.service';

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
    InstaPostImageModule,
    StorageModule,
  ],
  controllers: [InstaPostController],
  providers: [
    InstaPostService,
    InstaPostSequenceService,
    InstagramPostProcessor,
    PostPeerClient,
  ],
  exports: [InstaPostService],
})
export class InstaPostModule {}
