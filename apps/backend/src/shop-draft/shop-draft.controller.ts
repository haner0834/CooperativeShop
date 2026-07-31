import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShopDraftService } from './services/shop-draft.service';
import { ShopDraftDto } from './dto/shop-draft.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { EditLockToken } from './decorators/draft-lock-token.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types/auth.types';
import {
  AuthError,
  PermissionError,
  UnauthorizedError,
} from 'src/types/error.types';
import { SubmitDraftDto } from './dto/submit-draft.dto';
import { DraftFilterOptions } from './types/draft-filter-options.types';
import { GetDraftOptions } from './types/get-draft-options.types';
import { CurrentAdmin } from 'src/common/decorators/current-admin.decorator';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { AdminContext } from 'src/auth/types/admin-context.types';
import { ShopDraftReviewService } from './services/shop-draft-review.service';
import { ReviewDraftDto } from './dto/review-draft.dto';
import { DraftSearchQuery } from './types/search-query.types';
import { SearchedDraftDto } from './dto/searched-draft.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { PatchShopDraftDto } from './dto/patch-draft.dto';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { Idempotent } from 'src/idempotency/idempotent.decorator';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(
    private readonly shopDraftService: ShopDraftService,
    private readonly shopDraftLockService: ShopDraftLockService,
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

  @Post()
  @UseGuards(JwtAccessGuard)
  async create(
    @CurrentUser() user: UserPayload | null,
    @Body() dto: CreateDraftDto,
  ) {
    if (!user) throw new PermissionError();

    const created = await this.shopDraftService.createReserve(
      dto.title,
      dto.subtitle ?? null,
      user.schoolId,
    );
    return plainToInstance(ShopDraftDto, created, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload | null,
    @CurrentAdmin() admin: AdminContext | null,
  ) {
    if (!user && !admin) throw new PermissionError();

    await this.shopDraftService.deleteDraft(id, user?.schoolId, admin?.level);
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

  @Get('search')
  @UseGuards(JwtAccessGuard)
  async search(@Query() query: DraftSearchQuery): Promise<SearchedDraftDto[]> {
    return await this.shopDraftService.search(query.title, query.subtitle);
  }

  @Patch()
  @UseGuards(JwtAccessGuard)
  async update(
    @Body() dto: PatchShopDraftDto,
    @EditLockToken() token: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new UnauthorizedError();

    const { id, ...rest } = dto;

    await this.shopDraftService.partialUpdate(id, user.id, token, rest);
  }

  @Post('submit')
  @Idempotent()
  @UseGuards(JwtAccessGuard)
  async submit(
    @Body() dto: SubmitDraftDto,
    @EditLockToken() token: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new UnauthorizedError();

    // await this.shopDraftService.submitDraft(dto.draftId, user.id, token, {
    //   overwrite: dto.overwrite,
    // });
    console.log('hello world');
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

  @Post('acquire-lock/:id')
  @UseGuards(JwtAccessGuard)
  async acquireLock(
    @Param('id') draftId: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new PermissionError();

    return await this.shopDraftLockService.acquireLock(draftId, user.id);
  }

  @Post('release-lock/:id')
  @UseGuards(JwtAccessGuard)
  async releaseLock(
    @Param('id') draftId: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new PermissionError();

    return await this.shopDraftLockService.releaseLock(draftId, user.id);
  }
}
