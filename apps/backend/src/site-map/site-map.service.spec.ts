import { Test, TestingModule } from '@nestjs/testing';
import { SiteMapService } from './site-map.service';

describe('SiteMapService', () => {
  let service: SiteMapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiteMapService],
    }).compile();

    service = module.get<SiteMapService>(SiteMapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
