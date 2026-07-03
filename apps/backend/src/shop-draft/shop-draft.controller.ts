import { Controller, Get, Param } from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';
import { ShopDraftDto } from './dto/shop-draft.dto';
import { plainToInstance } from 'node_modules/class-transformer/types';
import { ShopDraftLockService } from './services/shop-draft-lock.service';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(private readonly shopDraftService: ShopDraftService) {}

  @Get('get')
  async get(@Param('id') id: string) {
    const draft = await this.shopDraftService.getDraft(id);

    return plainToInstance(ShopDraftDto, draft, {
      excludeExtraneousValues: true,
    });
  }
}
