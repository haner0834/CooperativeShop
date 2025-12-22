import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { Log } from 'src/common/decorators/logger.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type UserPayload } from 'src/auth/types/auth.types';
import { query } from 'winston';
import { GetShopsDto } from './dto/get-shop.dto';
import { BypassJwt } from 'src/common/decorators/bypass-jwt.decorator';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  /**
   * POST /shops/:id/save
   * 切換收藏狀態 (收藏/取消收藏)
   */
  @Post(':id/save')
  @UseGuards(JwtAccessGuard)
  async toggleSave(
    @Param('id') shopId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.shopsService.toggleSaveShop(user.id, shopId);
  }

  /**
   * GET /shops/saved
   * 取得當前用戶所有收藏的商店
   */
  @Get('saved')
  @UseGuards(JwtAccessGuard)
  async getSavedShops(@CurrentUser() user: UserPayload) {
    return this.shopsService.getSavedShops(user.id);
  }

  @Get('saved-ids')
  @UseGuards(JwtAccessGuard)
  async getSavedShopIds(@CurrentUser() user: UserPayload) {
    return this.shopsService.getSavedShopIds(user.id);
  }

  @Post()
  @UseGuards(JwtAccessGuard)
  @Log()
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopsService.create(createShopDto);
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @BypassJwt()
  findAll(
    @Query() query: GetShopsDto,
    @CurrentUser() user: UserPayload | undefined,
  ) {
    return this.shopsService.findAll(query, user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() updateShopDto: UpdateShopDto,
  ) {
    return this.shopsService.update(id, user, updateShopDto);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @Log()
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }
}
