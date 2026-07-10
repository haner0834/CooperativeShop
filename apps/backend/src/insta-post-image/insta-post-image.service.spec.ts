import { Test, TestingModule } from '@nestjs/testing';
import { InstaPostImageService } from './insta-post-image.service';

describe('InstaPostImageService', () => {
  let service: InstaPostImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstaPostImageService],
    }).compile();

    service = module.get<InstaPostImageService>(InstaPostImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
