import { Test, TestingModule } from '@nestjs/testing';
import { AiReviewService } from './ai-review.service';

describe('AiReviewService', () => {
  let service: AiReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiReviewService],
    }).compile();

    service = module.get<AiReviewService>(AiReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
