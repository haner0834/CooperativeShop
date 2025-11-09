import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [StorageController],
  providers: [StorageService],
  imports: [AuthModule],
})
export class StorageModule {}
