import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SchoolsModule } from './schools/schools.module';
import { QrModule } from './qr/qr.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, SchoolsModule, QrModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
