import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { QrModule } from './qr/qr.module';
import { PrismaModule } from './prisma/prisma.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ShopsModule } from './shops/shops.module';
import { StorageModule } from './storage/storage.module';
import { InteractionModule } from './interaction/interaction.module';
import { ShopRankingModule } from './shop-ranking/shop-ranking.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    AuthModule,
    SchoolsModule,
    QrModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1 * 60 * 1000,
          limit: 3000,
        },
      ],
    }),
    ShopRankingModule,
    ShopsModule,
    StorageModule,
    InteractionModule,
    KeepAliveModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
