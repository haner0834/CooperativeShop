import { Test, TestingModule } from '@nestjs/testing';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

describe('QrController', () => {
  let controller: QrController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrController],
      providers: [QrService],
    }).compile();

    controller = module.get<QrController>(QrController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
