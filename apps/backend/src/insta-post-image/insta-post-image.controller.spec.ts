import { Test, TestingModule } from '@nestjs/testing';
import { InstaPostImageController } from './insta-post-image.controller';
import { InstaPostImageService } from './insta-post-image.service';

describe('InstaPostImageController', () => {
  let controller: InstaPostImageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstaPostImageController],
      providers: [InstaPostImageService],
    }).compile();

    controller = module.get<InstaPostImageController>(InstaPostImageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
