import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { ShopDraftDto } from '../dto/shop-draft.dto';
import { GetDraftOptions } from '../types/get-draft-options.types';
import { ShopDraftService } from '../services/shop-draft.service';
import { DraftFilterOptions } from '../types/draft-filter-options.types';
import { AdminContext } from 'src/auth/types/admin-context.types';
import { CurrentAdmin } from 'src/common/decorators/current-admin.decorator';
import { PermissionError } from 'src/types/error.types';
import { ReviewDraftDto } from '../dto/review-draft.dto';
import { ShopDraftReviewService } from '../services/shop-draft-review.service';

@Controller('admin/shop-draft')
export class AdminShopDraftController {
  constructor(
    private readonly shopDraftService: ShopDraftService,
    private readonly shopDraftReviewService: ShopDraftReviewService,
  ) {}

  @Get(':id')
  @AdminOnly()
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
  @AdminOnly()
  async getDrafts(
    @Query() filters: DraftFilterOptions,
    @Query() options: GetDraftOptions,
  ): Promise<ShopDraftDto[]> {
    const drafts = await this.shopDraftService.getDrafts(filters, options);

    return plainToInstance(ShopDraftDto, drafts, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id/snapshot')
  @AdminOnly()
  async getDraftSnapshot(
    @Param('id') draftId: string,
    @CurrentAdmin() admin: AdminContext | null,
  ) {
    if (!admin) throw new PermissionError();

    const snapshot =
      await this.shopDraftReviewService.getReviewSnapshot(draftId);

    return plainToInstance(ShopDraftDto, snapshot, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/review')
  @AdminOnly()
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
