import { Controller, Get, UseGuards } from '@nestjs/common';
import { MapService } from './map.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type UserPayload } from 'src/auth/types/auth.types';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @UseGuards(JwtAccessGuard)
  @Get('check')
  async check(@CurrentUser() user: UserPayload) {
    const result = this.mapService.check(user.schoolId);
    return result;
  }
}
