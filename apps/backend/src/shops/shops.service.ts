import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppError } from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShopDto: CreateShopDto) {
    const { contactInfo, ...rest } = createShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);

    await this.prisma.shop.create({
      data: {
        contactInfo: plainContactInfo,
        ...rest,
      },
    });
  }

  async findAll() {
    return await this.prisma.shop.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.shop.findUnique({ where: { id } });
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    const { contactInfo, ...rest } = updateShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);

    return await this.prisma.shop.update({
      where: { id },
      data: {
        contactInfo: plainContactInfo,
        ...rest,
      },
    });
  }

  async remove(id: string) {
    throw new AppError('FUNCTION_UNFINISHED', 'Go fuck yourself', 500);
  }
}
