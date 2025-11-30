import { Test, TestingModule } from '@nestjs/testing';
import { ShopRankingService } from './shop-ranking.service';

describe('ShopRankingService', () => {
  let service: ShopRankingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopRankingService],
    }).compile();

    service = module.get<ShopRankingService>(ShopRankingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
