import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InteractionService } from './interaction.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { BypassJwt } from 'src/common/decorators/bypass-jwt.decorator';
import { IdentifierType } from '@prisma/client';
import { RecordImpressionDto } from './dto/record-impression.dto';
import { RecordTapDto } from './dto/record-tap.dto';
import { RecordViewTimeDto } from './dto/record-view-time.dto';
import { RecordViewDto } from './dto/record-view.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type UserPayload } from 'src/auth/types/auth.types';

@Controller('interactions')
@UseGuards(JwtAccessGuard)
@BypassJwt()
export class InteractionController {
  constructor(private interactionService: InteractionService) {}

  /**
   * POST /interactions/impressions
   * 記錄商家在列表中的曝光
   *
   * Rate limit: 150 requests per minute
   */
  @Post('impressions')
  @Throttle({ default: { limit: 150, ttl: 60 * 1000 } })
  async recordImpression(
    @CurrentUser() user: UserPayload,
    @Body() dto: RecordImpressionDto,
  ) {
    const { identifier, identifierType } = this.getIdentifier(
      user,
      dto.deviceId,
    );

    await this.interactionService.recordImpression(
      dto.shopId,
      identifier,
      identifierType,
    );

    return { recorded: true, type: 'impression' };
  }

  /**
   * POST /interactions/views
   * 記錄進入商家詳細頁
   *
   * Rate limit: 50 requests per minute
   */
  @Post('views')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async recordView(
    @CurrentUser() user: UserPayload,
    @Body() dto: RecordViewDto,
  ) {
    const { identifier, identifierType } = this.getIdentifier(
      user,
      dto.deviceId,
    );

    await this.interactionService.recordView(
      dto.shopId,
      identifier,
      identifierType,
    );

    return { recorded: true, type: 'view' };
  }

  /**
   * POST /interactions/taps
   * 記錄點擊商家的 CTA（打電話、導航、收藏等）
   *
   * Rate limit: 30 requests per minute
   */
  @Post('taps')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async recordTap(@CurrentUser() user: UserPayload, @Body() dto: RecordTapDto) {
    const { identifier, identifierType } = this.getIdentifier(
      user,
      dto.deviceId,
    );

    await this.interactionService.recordTap(
      dto.shopId,
      identifier,
      identifierType,
    );

    return { recorded: true, type: 'tap' };
  }

  /**
   * POST /interactions/view-time
   * 記錄在商家詳細頁的停留時間
   * Frontend 在離開頁面時上傳
   *
   * Rate limit: 30 requests per minute
   */
  @Post('view-time')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async recordViewTimeSec(
    @CurrentUser() user: UserPayload,
    @Body() dto: RecordViewTimeDto,
  ) {
    const { identifier, identifierType } = this.getIdentifier(
      user,
      dto.deviceId,
    );

    await this.interactionService.recordViewTimeSec(
      dto.shopId,
      identifier,
      identifierType,
      dto.duration,
    );

    return { recorded: true, type: 'view-time', duration: dto.duration };
  }

  /**
   * Helper: 取得 identifier 和 identifierType
   * 優先使用已登入用戶的 ID，否則使用 deviceId
   */
  private getIdentifier(
    user: UserPayload | undefined,
    deviceId?: string,
  ): { identifier: string; identifierType: IdentifierType } {
    if (user?.id) {
      return {
        identifier: user.id,
        identifierType: IdentifierType.USER,
      };
    }

    if (deviceId) {
      return {
        identifier: deviceId,
        identifierType: IdentifierType.DEVICE_ID,
      };
    }

    throw new BadRequestException(
      'Either user must be authenticated or deviceId must be provided',
    );
  }
}
