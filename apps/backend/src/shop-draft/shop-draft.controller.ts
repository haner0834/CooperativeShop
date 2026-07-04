import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';
import { ShopDraftDto } from './dto/shop-draft.dto';
import { plainToInstance } from 'node_modules/class-transformer/types';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { EditLockToken } from './decorators/draft-lock-token.decorator';
import { UpdateFieldDto } from './dto/update-field.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types/auth.types';
import { PermissionError, UnauthorizedError } from 'src/types/error.types';
import { BypassJwt } from 'src/common/decorators/bypass-jwt.decorator';
import { SubmitDraftDto } from './dto/submit-draft.dto';
import { DraftFilterOptions } from './types/draft-filter-options.types';
import { GetDraftOptions } from './types/get-draft-options.types';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(private readonly shopDraftService: ShopDraftService) {}

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  async get(
    @Param('id') id: string,
    @Query() options: GetDraftOptions,
  ): Promise<ShopDraftDto> {
    const draft = await this.shopDraftService.getDraft(id, options);

    return plainToInstance(ShopDraftDto, draft, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  async getDrafts(
    @Query() filters: DraftFilterOptions,
    @Query() options: GetDraftOptions,
  ): Promise<ShopDraftDto[]> {
    const drafts = await this.shopDraftService.getDrafts(filters, options);

    return plainToInstance(ShopDraftDto, drafts, {
      excludeExtraneousValues: true,
    });
  }

  @Put('update-field')
  @UseGuards(JwtAccessGuard)
  async update(
    @Body() dto: UpdateFieldDto,
    @EditLockToken() token: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new UnauthorizedError();
    if (!token) throw new PermissionError();

    this.shopDraftService.updateField(
      dto.id,
      user.id,
      token,
      dto.fieldName,
      dto.value,
    );
  }

  @Post('submit')
  @UseGuards(JwtAccessGuard)
  async submit(
    @Body() dto: SubmitDraftDto,
    @EditLockToken() token: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new UnauthorizedError();

    this.shopDraftService.submitDraft(dto.draftId, user.id, token, {
      overwrite: dto.overwrite,
    });
  }
}
