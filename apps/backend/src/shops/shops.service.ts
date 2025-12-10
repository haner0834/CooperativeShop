import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppError, BadRequestError } from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShopDto: CreateShopDto) {
    const { contactInfo, schedules, images, ...rest } = createShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);
    const plainSchedules = instanceToPlain(schedules);

    await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          contactInfo: plainContactInfo,
          schedules: plainSchedules,
          ...rest,
        },
      });

      const fileKeys = images.map((img) => img.fileKey);

      const fileRecords = await tx.fileRecord.findMany({
        where: { fileKey: { in: fileKeys } },
        select: { id: true, fileKey: true },
      });

      const fileRecordMap = Object.fromEntries(
        fileRecords.map((f) => [f.fileKey, f.id]),
      );

      for (const img of images) {
        if (!fileRecordMap[img.fileKey]) {
          throw new BadRequestError('FILE_NOT_FOUND', 'File not found.');
        }
      }

      await tx.shopImage.createMany({
        data: images.map((img, i) => ({
          fileId: fileRecordMap[img.fileKey],
          shopId: shop.id,
          order: i,
        })),
      });
    });
  }

  async findAll() {
    return await this.prisma.shop.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.shop.findUnique({ where: { id } });
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    // TODO: Update images
    const { contactInfo, schedules, images: _, ...rest } = updateShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);
    const plainSchedules = instanceToPlain(schedules);

    return await this.prisma.shop.update({
      where: { id },
      data: {
        contactInfo: plainContactInfo,
        schedules: plainSchedules,
        ...rest,
      },
    });
  }

  async remove(id: string) {
    throw new AppError('FUNCTION_UNFINISHED', 'Go fuck yourself', 500);
  }
}
