import { Module } from '@nestjs/common';
import { InstaPostImageService } from './insta-post-image.service';
import { InstaPostImageController } from './insta-post-image.controller';

@Module({
  controllers: [InstaPostImageController],
  providers: [InstaPostImageService],
  exports: [InstaPostImageService],
})
export class InstaPostImageModule {}
