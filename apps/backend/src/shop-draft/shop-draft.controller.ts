import { Controller } from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(private readonly shopDraftService: ShopDraftService) {}
}
