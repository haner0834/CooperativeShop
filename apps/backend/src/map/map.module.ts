import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { MapController } from './map.controller';

@Module({
  controllers: [MapController],
  providers: [MapService]
})
export class MapModule {}
