import { Test, TestingModule } from '@nestjs/testing';
import { InteractionService } from './interaction.service';

describe('InteractionService', () => {
  let service: InteractionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InteractionService],
    }).compile();

    service = module.get<InteractionService>(InteractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
