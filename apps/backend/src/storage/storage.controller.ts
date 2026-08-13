import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  PresignedUrlResult,
  PresignedUrlWithThumbnailResult,
  RecordFileResult,
  StorageService,
} from './storage.service';
import {
  ConfirmUploadDto,
  DeleteFileDto,
  GeneratePresignedUrlDto,
} from './dto/presigned-upload.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Log } from 'src/common/decorators/logger.decorator';
import { MetaContext } from 'src/common/interceptors/response-success.interceptor';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type UserPayload } from 'src/auth/types/auth.types';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @UseGuards(JwtAccessGuard)
  async generatePresignedUrl(@Body() body: GeneratePresignedUrlDto) {
    let result: PresignedUrlWithThumbnailResult | PresignedUrlResult;
    if (body.hasThumbnail) {
      result = await this.storageService.generatePresignedUrlWithThumbnail(
        body.fileName,
        body.contentType,
        body.category,
        body.fileSize,
      );
    } else {
      result = await this.storageService.generatePresignedUrl(
        body.fileName,
        body.contentType,
        body.category,
        body.fileSize,
      );
    }

    return result;
  }

  @Post('confirm-upload')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Body() body: ConfirmUploadDto,
    @CurrentUser() user: UserPayload,
  ) {
    const isMainFileExist = await this.storageService.verifyFileUploaded(
      body.fileKey,
    );
    const isThumbnailExist = body.thumbnailKey
      ? await this.storageService.verifyFileUploaded(body.thumbnailKey)
      : true;

    const isExist = isMainFileExist && isThumbnailExist;

    let record: RecordFileResult | null = null;
    if (isExist) {
      record = await this.storageService.recordFile(
        body.fileKey,
        body.category,
        body.contentType,
        user.id,
        body.thumbnailKey,
      );
    }

    return new MetaContext(record, { isExist });
  }

  @Post('delete')
  @UseGuards(JwtAccessGuard)
  async deleteFile(@Body() body: DeleteFileDto) {
    await this.storageService.deleteFile(body.fileKey, body.thumbnailKey);
    return null;
  }

  @Log()
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOrphanFiles() {
    // TODO: Complete cron job
  }
}
