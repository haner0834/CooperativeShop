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
import { SitemapModule } from './site-map/site-map.module';
import { DeviceCookieInterceptor } from './device-id/device-cookie.interceptor';
import { AccountModule } from './account/account.module';
import { DeviceIdGuard } from './device-id/device-id.guard';
import { DeviceIdService } from './device-id/device-id.service';
import { CloudflareContextInterceptor } from './common/interceptors/cloudflare-context.interceptor';
import { MapModule } from './map/map.module';
import { ShopDraftModule } from './shop-draft/shop-draft.module';
import { BullModule } from '@nestjs/bullmq';
import { InstaPostModule } from './insta-post/insta-post.module';
import { AiReviewModule } from './ai-review/ai-review.module';
import { InstaPostImageModule } from './insta-post-image/insta-post-image.module';

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
    SitemapModule,
    AccountModule,
    MapModule,
    ShopDraftModule,
    BullModule.forRootAsync({
      useFactory: () => {
        const parsed = new URL(env('REDIS_URI'));
        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    InstaPostModule,
    AiReviewModule,
    InstaPostImageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RateLimitService,
    DeviceIdService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CloudflareContextInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: DeviceIdGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DeviceCookieInterceptor,
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
  ],
})
export class AppModule {}
