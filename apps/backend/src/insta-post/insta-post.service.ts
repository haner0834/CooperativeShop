import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INSTAGRAM_POST_QUEUE } from './insta-post.constants';
import { CreateInstagramPostDto } from './dto/create-insta-post.dto';
import { InstaPostImageService } from 'src/insta-post-image/insta-post-image.service';
import { InstaPostSequenceService } from './insta-post-sequence.service';
import { StorageService } from 'src/storage/storage.service';
import { getImageUrl } from 'src/common/utils/get-image-url.utils';
import { InternalError } from 'src/types/error.types';
import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import { env } from 'src/common/utils/env.utils';
import { Log } from 'src/common/decorators/logger.decorator';

@Injectable()
export class InstaPostService {
  constructor(
    @InjectQueue(INSTAGRAM_POST_QUEUE) private readonly queue: Queue,
    private readonly instaPostImageService: InstaPostImageService,
    private readonly instaPostSequenceService: InstaPostSequenceService,
    private readonly storageService: StorageService,
  ) {}

  async schedulePostFromShop(shopDraft: ShopDraftDto) {
    if (!shopDraft.shopId) {
      throw new InternalError(
        'shopId is required on shopDraft to schedule an Instagram post',
      );
    }

    // 決定這篇貼文在「cover style / 正反」循環中的位置。
    // 這一步就是這篇貼文在序列中「定案」的時間點——之後即便發文
    // 因 rate limit 被延後，樣式也不會變。
    const visualState = await this.instaPostSequenceService.next();

    const generatedImages =
      await this.instaPostImageService.generateInstaPostImages(
        shopDraft,
        visualState,
      );

    const uploadDto = generatedImages.map(({ type, buffer }) => ({
      name: `${type}-${shopDraft.id}`,
      fileKey: `insta-post-${type.toLocaleLowerCase()}/${shopDraft.id}`,
      mimeType: `image/png`,
      buffer: buffer,
    }));

    const result = await this.storageService.uploadBatch(uploadDto);

    // deal with failed file看是要重試還是要衝三小

    const draftImageUrls = shopDraft.images
      .filter((image) => !!image.uploadInfo)
      .map((image) => getImageUrl(image.uploadInfo!.fileKey));

    const generatedImageUrls = uploadDto.map((item) =>
      getImageUrl(item.fileKey),
    );

    const postImageUrls = generatedImageUrls.concat(draftImageUrls);

    await this.schedulePost({
      accountId: env('INSTA_ACCOUNT_ID'),
      content: this.getPostContent(shopDraft),
      mediaItems: postImageUrls.map((url) => ({ type: 'image', url })),
    });
  }

  /**
   * 供其他模組呼叫：把一篇 IG 貼文加入發文佇列
   */
  @Log()
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

  private getPostContent(draft: ShopDraftDto): string {
    return '';
  }
}
