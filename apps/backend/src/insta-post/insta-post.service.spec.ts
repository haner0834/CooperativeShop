import { Test, TestingModule } from '@nestjs/testing';
import { InstaPostService } from './insta-post.service';

describe('InstaPostService', () => {
  let service: InstaPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstaPostService],
    }).compile();

    service = module.get<InstaPostService>(InstaPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
