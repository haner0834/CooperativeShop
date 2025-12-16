import { Injectable } from '@nestjs/common';
import {
  ContactInfoDto,
  CreateShopDto,
  WorkScheduleDto,
} from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';
import { calculateRequestHash } from 'src/common/utils/calculate-req-hash.utils';
import { Shop as PrismaShop } from '@prisma/client'; // 引入 Prisma 產生的類型
import { FileRecord } from '@prisma/client'; // 引入 FileRecord 類型
import { ResponseImageDto, ResponseShopDto } from './dto/response-shop.dto';
import { env } from 'src/common/utils/env.utils';

type ShopWithRelations = PrismaShop & {
  school: { abbreviation: string };
  images: { file: FileRecord }[];
};

@Injectable()
export class ShopsService {
  private readonly R2_PUBLIC_URL = env('R2_PUBLIC_URL');
  constructor(private readonly prisma: PrismaService) {}

  private transformShopToDto(shop: ShopWithRelations): ResponseShopDto {
    const contactInfo: ContactInfoDto[] =
      shop.contactInfo as unknown as ContactInfoDto[];

    const workSchedules: WorkScheduleDto[] =
      shop.schedules as unknown as WorkScheduleDto[];

    const thumbnailKey = shop.thumbnailKey;

    const getFileUrlByKey = (key: string): string => {
      return `${this.R2_PUBLIC_URL}/${key}`;
    };

    const thumbnailLink = getFileUrlByKey(thumbnailKey);

    const images: ResponseImageDto[] = shop.images.map((shopImage) => ({
      fileUrl: shopImage.file.url,
      thumbnailUrl: shopImage.file.thumbnailUrl,
    }));

    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;

    return {
      id: shop.id,
      title: shop.title,
      subTitle: shop.subTitle,
      description: shop.description,
      contactInfo,
      schoolId: shop.schoolId,
      schoolAbbr: shop.school.abbreviation,
      images,
      thumbnailLink,
      discount: shop.discount,
      address: shop.address,
      longitude: shop.longitude,
      latitude: shop.latitude,
      workSchedules,
      googleMapsLink,
    };
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

  async findAll(schoolAbbr: string): Promise<ResponseShopDto[]> {
    const shops = await this.prisma.shop.findMany({
      where: { school: { abbreviation: schoolAbbr } },
      include: {
        school: { select: { abbreviation: true } },
        images: { include: { file: true } },
      },
    });

    const shopsDto = shops.map((item) => this.transformShopToDto(item));
    return shopsDto;
  }

  async findOne(id: string): Promise<ResponseShopDto> {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        school: { select: { abbreviation: true } },
        images: { include: { file: true } },
      },
    });
    if (!shop) {
      throw new NotFoundError('SHOP_NOT_FOUND', 'Shop not found.');
    }
    return this.transformShopToDto(shop);
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
