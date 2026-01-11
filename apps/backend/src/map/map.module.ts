import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [MapController],
  providers: [MapService],
  imports: [AuthModule],
})
export class MapModule {}
