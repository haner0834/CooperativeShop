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

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Log()
  @Post()
  @UseGuards(JwtAccessGuard)
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopsService.create(createShopDto);
  }

  @Get()
  findAll(@Query('school') schoolAbbr: string) {
    return this.shopsService.findAll(schoolAbbr);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopsService.update(id, updateShopDto);
  }

  @Log()
  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }
}
