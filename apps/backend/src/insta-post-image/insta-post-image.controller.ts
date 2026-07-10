import { Controller, Get } from '@nestjs/common';
import { InstaPostImageService } from './insta-post-image.service';

@Controller('insta-post-image')
export class InstaPostImageController {
  constructor(private readonly instaPostImageService: InstaPostImageService) {}
}
