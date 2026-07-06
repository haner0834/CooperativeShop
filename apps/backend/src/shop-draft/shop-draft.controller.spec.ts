import { Test, TestingModule } from '@nestjs/testing';
import { ShopDraftController } from './shop-draft.controller';
import { ShopDraftService } from './services/shop-draft.service';

describe('ShopDraftController', () => {
  let controller: ShopDraftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopDraftController],
      providers: [ShopDraftService],
    }).compile();

    controller = module.get<ShopDraftController>(ShopDraftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
