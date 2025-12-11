import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ShopsController],
  providers: [ShopsService],
  imports: [AuthModule],
})
export class ShopsModule {}
