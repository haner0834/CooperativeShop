import { Test, TestingModule } from '@nestjs/testing';
import { ShopRankingController } from './shop-ranking.controller';
import { ShopRankingService } from './shop-ranking.service';

describe('ShopRankingController', () => {
  let controller: ShopRankingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopRankingController],
      providers: [ShopRankingService],
    }).compile();

    controller = module.get<ShopRankingController>(ShopRankingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
