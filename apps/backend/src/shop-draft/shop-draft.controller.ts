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
import { ShopDraftService } from './services/shop-draft.service';
import { ShopDraftDto } from './dto/shop-draft.dto';
import { plainToInstance } from 'class-transformer';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { EditLockToken } from './decorators/draft-lock-token.decorator';
import { UpdateFieldDto } from './dto/update-field.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types/auth.types';
import {
  BadRequestError,
  PermissionError,
  UnauthorizedError,
} from 'src/types/error.types';
import { BypassJwt } from 'src/common/decorators/bypass-jwt.decorator';
import { SubmitDraftDto } from './dto/submit-draft.dto';
import { DraftFilterOptions } from './types/draft-filter-options.types';
import { GetDraftOptions } from './types/get-draft-options.types';
import { CurrentAdmin } from 'src/common/decorators/current-admin.decorator';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { AdminContext } from 'src/auth/types/admin-context.types';
import { ShopDraftReviewService } from './services/shop-draft-review.service';
import { ReviewDraftDto } from './dto/review-draft.dto';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(
    private readonly shopDraftService: ShopDraftService,
    private readonly shopDraftReviewService: ShopDraftReviewService,
  ) {}

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

  @Get(':id/snapshot')
  @UseGuards(JwtAccessGuard)
  @RequireRole('ADMIN', 'ORGANIZATION')
  async getDraftSnapshot(
    @Param('id') draftId: string,
    @CurrentAdmin() admin: AdminContext | null,
  ) {
    if (!admin) throw new PermissionError();

    const snapshot = await this.shopDraftReviewService.getReviewSnapshot(
      draftId,
      admin.adminId,
    );

    return plainToInstance(ShopDraftDto, snapshot, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/review')
  @UseGuards(JwtAccessGuard)
  @RequireRole('ADMIN', 'ORGANIZATION')
  async reviewDraft(
    @Param('id') draftId: string,
    @Body() dto: ReviewDraftDto,
    @CurrentAdmin() admin: AdminContext | null,
  ) {
    if (!admin) throw new PermissionError();

    await this.shopDraftReviewService.reviewDraft(
      draftId,
      admin,
      dto.result,
      dto.rejectReason,
    );
  }
}
