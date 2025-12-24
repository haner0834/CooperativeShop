import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { QrModule } from './qr/qr.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ShopsModule } from './shops/shops.module';
import { StorageModule } from './storage/storage.module';
import { InteractionModule } from './interaction/interaction.module';
import { ShopRankingModule } from './shop-ranking/shop-ranking.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RateLimitService } from './rate-limit/rate-limit.service';
import { GlobalExceptionFilter } from './common/interceptors/response-errpr.interceptor';
import { SuccessResponseInterceptor } from './common/interceptors/response-success.interceptor';
import { RiskAssessmentInterceptor } from './rate-limit/risk-assessment.interceptor';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { RedisModule } from '@nestjs-modules/ioredis';
import { env } from './common/utils/env.utils';

@Module({
  imports: [
    AuthModule,
    SchoolsModule,
    QrModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    ShopRankingModule,
    ShopsModule,
    StorageModule,
    InteractionModule,
    KeepAliveModule,
    RedisModule.forRoot({
      url: env('REDIS_URI'),
      type: 'single',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RateLimitService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RiskAssessmentInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    RateLimitService,
  ],
})
export class AppModule {}
