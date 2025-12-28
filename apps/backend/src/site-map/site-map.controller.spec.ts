import { Test, TestingModule } from '@nestjs/testing';
import { SiteMapController } from './site-map.controller';

describe('SiteMapController', () => {
  let controller: SiteMapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteMapController],
    }).compile();

    controller = module.get<SiteMapController>(SiteMapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
