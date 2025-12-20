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
  AuthError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';
import { calculateRequestHash } from 'src/common/utils/calculate-req-hash.utils';
import { Prisma, Shop as PrismaShop } from '@prisma/client'; // 引入 Prisma 產生的類型
import { FileRecord } from '@prisma/client'; // 引入 FileRecord 類型
import { ResponseImageDto, ResponseShopDto } from './dto/response-shop.dto';
import { env } from 'src/common/utils/env.utils';
import { UserPayload } from 'src/auth/types/auth.types';
import { GetShopsDto, ShopSortBy } from './dto/get-shop.dto';

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

  async findAll(dto: GetShopsDto) {
    const {
      q,
      sortBy,
      minLat,
      maxLat,
      minLng,
      maxLng, // Map Viewport
      userLat,
      userLng, // User Location
      isOpen,
      hasDiscount,
      schoolId,
      limit = 20,
      offset = 0,
    } = dto;

    const where: Prisma.ShopWhereInput = {};

    // 1. 基礎篩選
    if (schoolId) where.schoolId = schoolId;
    if (hasDiscount) where.discount = { not: null };

    // 2. 關鍵字搜尋 (標題或敘述)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 3. 地圖可視範圍 (Lazy Load 核心)
    if (minLat && maxLat && minLng && maxLng) {
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    }

    // 4. 營業中篩選 (Server Side Calculation)
    if (isOpen) {
      // 假設目標時區為台灣時間 (UTC+8)
      const now = new Date();
      const TW_OFFSET = 8 * 60; // 分鐘
      const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

      // 計算台灣當地的 "星期幾" 與 "分鐘數"
      // 注意：需處理跨日問題，這裡簡化處理，建議使用 date-fns-tz
      const twNow = new Date(now.getTime() + TW_OFFSET * 60 * 1000);
      const currentDay = twNow.getUTCDay();
      const currentMinute = twNow.getUTCHours() * 60 + twNow.getUTCMinutes();

      where.workSchedules = {
        some: {
          dayOfWeek: currentDay,
          startMinute: { lte: currentMinute },
          endMinute: { gte: currentMinute },
        },
      };
    }

    // 5. 排序邏輯
    let orderBy: Prisma.ShopOrderByWithRelationInput | undefined;

    // 根據 Cached Score 排序 (極快)
    if (sortBy === ShopSortBy.HOT) orderBy = { cachedHotScore: 'desc' };
    else if (sortBy === ShopSortBy.HOME) orderBy = { cachedHomeScore: 'desc' };

    // 若為 Nearby，因 Prisma 不支援 PostGIS Distance 排序，需取出後在記憶體排序
    // 考慮到總量僅 300 家，這在 Node.js 層處理非常快
    const isNearbySort = sortBy === ShopSortBy.DISTANCE && userLat && userLng;

    const shops = await this.prisma.shop.findMany({
      where,
      // 若是 Nearby 排序，先不分頁 (take/skip)，全抓出來算距離
      take: isNearbySort ? undefined : limit,
      skip: isNearbySort ? undefined : offset,
      orderBy: isNearbySort ? undefined : orderBy,
      include: {
        images: { take: 1, orderBy: { order: 'asc' }, include: { file: true } },
        workSchedules: true, // 前端可能需要顯示營業時間細節
        school: { select: { abbreviation: true } },
      },
    });

    // 6. 資料轉換與距離計算
    let results = shops.map((shop) => {
      const thumbnail = shop.images[0]?.file?.url
        ? `${process.env.R2_PUBLIC_URL}/${shop.images[0].file.fileKey}` // 或使用您現有的邏輯
        : null;

      let distance: number | null = null;
      if (userLat && userLng) {
        distance = this.calculateDistance(
          userLat,
          userLng,
          shop.latitude,
          shop.longitude,
        );
      }

      return {
        ...shop,
        thumbnailLink: thumbnail,
        distance, // km
        // 為了前端方便，可直接回傳 isOpen boolean
        // isOpen: this.checkIsOpen(shop.workSchedules)
      };
    });

    // 7. Nearby 記憶體排序與手動分頁
    if (isNearbySort) {
      results.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
      // Manual Pagination
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  // Haversine
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

  async update(id: string, user: UserPayload, updateShopDto: UpdateShopDto) {
    const currentShop = await this.prisma.shop.findUnique({
      where: { id },
      include: { images: { include: { file: true } } },
    });

    if (!currentShop)
      throw new NotFoundError('SHOP_NOT_FOUND', 'Shop not found.');
    if (currentShop.schoolId !== user.schoolId) {
      throw new AuthError('ACCESS_DENIED', 'Modification is forbidden.');
    }

    const { contactInfo, schedules, images, ...rest } = updateShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);
    const plainSchedules = instanceToPlain(schedules);

    return await this.prisma.$transaction(async (tx) => {
      await tx.shop.update({
        where: { id },
        data: {
          contactInfo: plainContactInfo,
          schedules: plainSchedules,
          ...rest,
        },
      });

      // 2. Diff images and update
      if (images) {
        const currentImages = currentShop.images;
        const newFileKeys = images.map((img) => img.fileKey);
        const currentFileKeys = currentImages.map((img) => img.file.fileKey);

        // A. Find relationships to remove (current has, new value hasn't)
        const keysToDelete = currentFileKeys.filter(
          (key) => !newFileKeys.includes(key),
        );
        if (keysToDelete.length > 0) {
          await tx.shopImage.deleteMany({
            where: {
              shopId: id,
              file: { fileKey: { in: keysToDelete } },
            },
          });
        }

        // B. Find relationships to create (new value has, current hasn't)
        const keysToAdd = newFileKeys.filter(
          (key) => !currentFileKeys.includes(key),
        );
        if (keysToAdd.length > 0) {
          const fileRecords = await tx.fileRecord.findMany({
            where: { fileKey: { in: keysToAdd } },
          });
          const fileRecordMap = Object.fromEntries(
            fileRecords.map((f) => [f.fileKey, f.id]),
          );

          for (const key of keysToAdd) {
            const fileId = fileRecordMap[key];
            if (!fileId)
              throw new BadRequestError(
                'FILE_NOT_FOUND',
                `File ${key} not found.`,
              );
            await tx.shopImage.create({
              data: {
                shopId: id,
                fileId: fileId,
                order: newFileKeys.indexOf(key),
              },
            });
          }
        }

        // C. update existings (order may change)
        for (let i = 0; i < newFileKeys.length; i++) {
          await tx.shopImage.updateMany({
            where: {
              shopId: id,
              file: { fileKey: newFileKeys[i] },
            },
            data: { order: i },
          });
        }
      }
    });
  }

  async remove(id: string) {
    await this.prisma.shop.delete({
      where: { id },
    });
  }
}
