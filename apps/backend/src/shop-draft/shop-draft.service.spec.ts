import { Test, TestingModule } from '@nestjs/testing';
import { ShopDraftService } from './services/shop-draft.service';

describe('ShopDraftService', () => {
  let service: ShopDraftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopDraftService],
    }).compile();

    service = module.get<ShopDraftService>(ShopDraftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
