import { Test, TestingModule } from '@nestjs/testing';
import { KeepAliveService } from './keep-alive.service';

describe('KeepAliveService', () => {
  let service: KeepAliveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeepAliveService],
    }).compile();

    service = module.get<KeepAliveService>(KeepAliveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
