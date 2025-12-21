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

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @Log()
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopsService.create(createShopDto);
  }

  @Get()
  findAll(@Query() query: GetShopsDto) {
    return this.shopsService.findAll(query);
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
