import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecordFileResult, StorageService } from './storage.service';
import {
  ConfirmUploadDto,
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
    const result = await this.storageService.generatePresignedUrl(
      body.fileName,
      body.contentType,
      body.category,
      body.fileSize,
    );

    return result;
  }

  @Post('confirm-upload')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Body() body: ConfirmUploadDto,
    @CurrentUser() user: UserPayload,
  ) {
    const isExist = await this.storageService.verifyFileUploaded(body.fileKey);

    let record: RecordFileResult | null = null;
    if (isExist) {
      record = await this.storageService.recordFile(
        body.fileKey,
        body.category,
        body.thumbnailKey,
        body.contentType,
        user.id,
      );
    }

    return new MetaContext(record, { isExist });
  }

  @Log()
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOrphanFiles() {
    // TODO: Complete cron job
  }
}
