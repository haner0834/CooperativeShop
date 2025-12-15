import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AppError,
  BadRequestError,
  ConflictError,
} from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';
import { calculateRequestHash } from 'src/common/utils/calculate-req-hash.utils';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 確保浮點數（如經緯度）精度一致的輔助函數
   */
  normalizeFloatPrecision(data: any): any {
    if (typeof data === 'number') {
      // 固定經緯度精度至 6 位小數
      return parseFloat(data.toFixed(6));
    }
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map((item) => this.normalizeFloatPrecision(item));
      }
      const normalized: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          normalized[key] = this.normalizeFloatPrecision(data[key]);
        }
      }
      return normalized;
    }
    return data;
  }

  async create(createShopDto: CreateShopDto) {
    const requestHashId = calculateRequestHash(createShopDto);

    const { contactInfo, schedules, images, ...rest } = createShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);
    const plainSchedules = instanceToPlain(schedules);

    await this.prisma.$transaction(async (tx) => {
      const existingShop = await tx.shop.findUnique({
        where: { requestHashId: requestHashId },
        select: { id: true, title: true },
      });

      if (existingShop) {
        throw new ConflictError(
          'DUPLICATE_REQUEST',
          `Shop creation with this content has already been processed (Shop ID: ${existingShop.id}).`,
        );
      }

      const fileKeys = images.map((img) => img.fileKey);

      if (fileKeys.length > 0) {
        const occupiedImages = await tx.shopImage.findMany({
          where: {
            file: {
              fileKey: { in: fileKeys },
            },
          },
          select: {
            fileId: true,
            file: { select: { fileKey: true } },
          },
        });

        if (occupiedImages.length > 0) {
          const occupiedKeys = occupiedImages.map((img) => img.file.fileKey);
          throw new ConflictError(
            'FILE_ALREADY_USED',
            `One or more files have already been used by another Shop: ${occupiedKeys.join(', ')}.`,
          );
        }
      }

      const shop = await tx.shop.create({
        data: {
          contactInfo: plainContactInfo,
          schedules: plainSchedules,
          requestHashId: requestHashId,
          ...rest,
        },
      });

      const fileRecords = await tx.fileRecord.findMany({
        where: { fileKey: { in: fileKeys } },
        select: { id: true, fileKey: true },
      });

      const fileRecordMap = Object.fromEntries(
        fileRecords.map((f) => [f.fileKey, f.id]),
      );

      for (const img of images) {
        if (!fileRecordMap[img.fileKey]) {
          throw new BadRequestError(
            'FILE_NOT_FOUND',
            'File not found or not uploaded.',
          );
        }
      }

      await tx.shopImage.createMany({
        data: images.map((img, i) => ({
          fileId: fileRecordMap[img.fileKey],
          shopId: shop.id,
          order: i,
        })),
      });

      return shop;
    });
  }

  async findAll(schoolAbbr: string) {
    return await this.prisma.shop.findMany({
      where: { school: { abbreviation: schoolAbbr } },
    });
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
