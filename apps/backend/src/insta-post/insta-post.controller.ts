import { Controller } from '@nestjs/common';
import { InstaPostService } from './insta-post.service';

@Controller('insta-post')
export class InstaPostController {
  constructor(private readonly instaPostService: InstaPostService) {}
}
