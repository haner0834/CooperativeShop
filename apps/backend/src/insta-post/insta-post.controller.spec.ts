import { Test, TestingModule } from '@nestjs/testing';
import { InstaPostController } from './insta-post.controller';
import { InstaPostService } from './insta-post.service';

describe('InstaPostController', () => {
  let controller: InstaPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstaPostController],
      providers: [InstaPostService],
    }).compile();

    controller = module.get<InstaPostController>(InstaPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
