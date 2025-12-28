import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { AuthModule } from 'src/auth/auth.module';
import { SchoolRateLimitGuard } from './shops.guard';
import { RateLimitService } from 'src/rate-limit/rate-limit.service';

@Module({
  controllers: [ShopsController],
  providers: [ShopsService, SchoolRateLimitGuard, RateLimitService],
  imports: [AuthModule],
})
export class ShopsModule {}
