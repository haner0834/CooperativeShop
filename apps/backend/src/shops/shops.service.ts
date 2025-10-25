import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppError } from 'src/types/error.types';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShopDto: CreateShopDto) {
    await this.prisma.shop.create({ data: createShopDto });
  }

  async findAll() {
    return await this.prisma.shop.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.shop.findUnique({ where: { id } });
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    return await this.prisma.shop.update({
      where: { id },
      data: updateShopDto,
    });
  }

  async remove(id: string) {
    throw new AppError('FUNCTION_UNFINISHED', 'Go fuck yourself', 500);
  }
}
