import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';

@Module({
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
