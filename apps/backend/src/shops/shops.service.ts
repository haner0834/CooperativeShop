import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AuthError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/types/error.types';
import { instanceToPlain } from 'class-transformer';
import { calculateRequestHash } from 'src/common/utils/calculate-req-hash.utils';
import { Prisma, Shop as PrismaShop, WorkSchedule } from '@prisma/client'; // 引入 Prisma 產生的類型
import { FileRecord } from '@prisma/client'; // 引入 FileRecord 類型
import { ResponseShopDto } from './dto/response-shop.dto';
import { env } from 'src/common/utils/env.utils';
import { UserPayload } from 'src/auth/types/auth.types';
import { GetShopsDto, ShopSortBy } from './dto/get-shop.dto';
import { Weekday } from './types/work-schedule.type';

type ShopWithRelations = PrismaShop & {
  school: { abbreviation: string };
  workSchedules: WorkSchedule[];
  images: { file: FileRecord }[];
  _count?: {
    savedBy: number;
  };
};

@Injectable()
export class ShopsService {
  private readonly R2_PUBLIC_URL = env('R2_PUBLIC_URL');
  constructor(private readonly prisma: PrismaService) {}

  async create(createShopDto: CreateShopDto) {
    const requestHashId = calculateRequestHash(createShopDto);

    // 1. 解構資料，注意現在不需要 plainSchedules JSON 了
    const {
      contactInfo,
      schedules: workSchedules,
      images,
      ...rest
    } = createShopDto;
    const plainContactInfo = instanceToPlain(contactInfo);

    const WeekdayToInt: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };

    return await this.prisma.$transaction(async (tx) => {
      // 2. 冪等性檢查 (Request Hash)
      const existingShop = await tx.shop.findUnique({
        where: { requestHashId: requestHashId },
        select: { id: true },
      });

      if (existingShop) {
        throw new ConflictError(
          'DUPLICATE_REQUEST',
          `Shop creation already processed (Shop ID: ${existingShop.id}).`,
        );
      }

      // 3. 檢查圖片是否被佔用
      const fileKeys = images.map((img) => img.fileKey);
      if (fileKeys.length > 0) {
        const occupiedImages = await tx.shopImage.findMany({
          where: { file: { fileKey: { in: fileKeys } } },
          select: { file: { select: { fileKey: true } } },
        });

        if (occupiedImages.length > 0) {
          const occupiedKeys = occupiedImages.map((img) => img.file.fileKey);
          throw new ConflictError(
            'FILE_ALREADY_USED',
            `Files already used: ${occupiedKeys.join(', ')}.`,
          );
        }
      }

      // 4. 建立商店本體
      const shop = await tx.shop.create({
        data: {
          ...rest,
          schedules: {},
          contactInfo: plainContactInfo,
          requestHashId: requestHashId,
        },
      });

      // 5. 處理 WorkSchedules 關聯建立
      if (workSchedules && workSchedules.length > 0) {
        await tx.workSchedule.createMany({
          data: workSchedules.map((s) => ({
            shopId: shop.id,
            dayOfWeek: WeekdayToInt[s.weekday],
            startMinute: s.startMinuteOfDay,
            endMinute: s.endMinuteOfDay,
          })),
        });
      }

      // 6. 處理圖片關聯
      const fileRecords = await tx.fileRecord.findMany({
        where: { fileKey: { in: fileKeys } },
        select: { id: true, fileKey: true },
      });

      const fileRecordMap = Object.fromEntries(
        fileRecords.map((f) => [f.fileKey, f.id]),
      );

      for (const key of fileKeys) {
        if (!fileRecordMap[key]) {
          throw new BadRequestError('FILE_NOT_FOUND', `File ${key} not found.`);
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

  async findAll(
    dto: GetShopsDto,
    userId: string | undefined,
  ): Promise<ResponseShopDto[]> {
    const {
      q,
      sortBy,
      minLat,
      maxLat,
      minLng,
      maxLng,
      userLat,
      userLng,
      isOpen,
      hasDiscount,
      schoolAbbr,
      limit = 20,
      offset = 0,
    } = dto;

    const where: Prisma.ShopWhereInput = {};

    // --- 篩選邏輯 ---
    if (schoolAbbr) where.school = { abbreviation: schoolAbbr };
    if (hasDiscount) where.discount = { not: null };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (minLat && maxLat && minLng && maxLng) {
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLng, lte: maxLng };
    }

    // 計算當前時間 (UTC+8 簡易版，建議用 date-fns-tz 處理時區)
    const now = new Date();
    // 假設 Server 是 UTC，轉換為台灣時間
    const twTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const currentDay = twTime.getUTCDay();
    const currentMinute = twTime.getUTCHours() * 60 + twTime.getUTCMinutes();

    if (isOpen) {
      where.workSchedules = {
        some: {
          dayOfWeek: currentDay,
          startMinute: { lte: currentMinute },
          endMinute: { gte: currentMinute },
        },
      };
    }

    // --- 排序邏輯 ---
    let orderBy: Prisma.ShopOrderByWithRelationInput | undefined;
    if (sortBy === ShopSortBy.HOT) orderBy = { cachedHotScore: 'desc' };
    else if (sortBy === ShopSortBy.HOME) orderBy = { cachedHomeScore: 'desc' };

    const isNearbySort =
      sortBy === ShopSortBy.DISTANCE && !!userLat && !!userLng;

    // --- 查詢資料庫 ---
    const shops = await this.prisma.shop.findMany({
      where,
      take: isNearbySort ? undefined : limit,
      skip: isNearbySort ? undefined : offset,
      orderBy: isNearbySort ? undefined : orderBy,
      include: {
        images: {
          orderBy: { order: 'asc' },
          include: { file: true },
        },
        workSchedules: true,
        school: { select: { abbreviation: true } },
        _count: userId
          ? {
              select: {
                savedBy: { where: { userId } },
              },
            }
          : undefined,
      },
    });

    // --- 轉換為 ResponseShopDto ---
    let results = shops.map((shop) =>
      this.transformShopToDto(
        shop,
        userLat,
        userLng,
        currentDay,
        currentMinute,
      ),
    );

    // --- Nearby 記憶體排序 ---
    if (isNearbySort) {
      results.sort(
        (a, b) => (a.distance || Infinity) - (b.distance || Infinity),
      );
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  async findOne(id: string): Promise<ResponseShopDto> {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        school: { select: { abbreviation: true } },
        images: { include: { file: true } },
        workSchedules: true,
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

  async toggleSaveShop(
    userId: string,
    shopId: string,
  ): Promise<{ saved: boolean }> {
    // 1. Check if shop exist
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundError('SHOP_NOT_FOUND', 'Shop not found');

    // 2. Check if has saved
    const existingSave = await this.prisma.savedShop.findUnique({
      where: {
        userId_shopId: { userId, shopId },
      },
    });

    if (existingSave) {
      // 3. has saved, delete it
      await this.prisma.savedShop.delete({
        where: { id: existingSave.id },
      });
      return { saved: false };
    } else {
      // 4. hasn't saved, create
      await this.prisma.savedShop.create({
        data: { userId, shopId },
      });
      return { saved: true };
    }
  }

  async getSavedShops(userId: string): Promise<ResponseShopDto[]> {
    const savedItems = await this.prisma.savedShop.findMany({
      where: { userId },
      include: {
        shop: {
          include: {
            images: { orderBy: { order: 'asc' }, include: { file: true } },
            school: true,
            workSchedules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savedItems.map((item) =>
      this.transformShopToDto(item.shop, undefined, undefined),
    );
  }

  async getSavedShopIds(userId: string): Promise<string[]> {
    const savedItemIds = await this.prisma.savedShop.findMany({
      where: { userId },
      select: { shopId: true },
      orderBy: { createdAt: 'desc' },
    });

    return savedItemIds.map((s) => s.shopId);
  }

  private transformShopToDto(
    shop: ShopWithRelations,
    userLat?: number,
    userLng?: number,
    currentDay?: number,
    currentMinute?: number,
  ): ResponseShopDto {
    // 計算距離
    let distance: number | undefined;
    if (userLat && userLng) {
      distance = this.calculateDistance(
        userLat,
        userLng,
        shop.latitude,
        shop.longitude,
      );
    }

    // 計算是否營業中 (即便沒篩選 isOpen，前端也需要這個 flag)
    let isOpen = false;
    if (currentDay !== undefined && currentMinute !== undefined) {
      isOpen = shop.workSchedules.some(
        (s) =>
          s.dayOfWeek === currentDay &&
          s.startMinute <= currentMinute &&
          s.endMinute >= currentMinute,
      );
    }

    const isSaved = shop._count ? shop._count?.savedBy > 0 : false;

    // 圖片處理
    const images = shop.images.map((img) => ({
      fileUrl: img.file.url,
      thumbnailUrl: img.file.thumbnailUrl, // 假設 FileRecord 有此欄位
    }));

    // 若沒有預先生成 thumbnailKey，則使用第一張圖
    const thumbnailLink = shop.thumbnailKey
      ? `${this.R2_PUBLIC_URL}/${shop.thumbnailKey}`
      : images[0]?.thumbnailUrl || null;

    // 修正 Google Maps Link
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;

    // NOTE: contactInfo is already a Json
    const contactInfo = shop.contactInfo as any;

    // WorkSchedules 轉換 (Prisma Model -> DTO)
    const workSchedules = shop.workSchedules.map((ws) => ({
      weekday: this.mapIntToWeekday(ws.dayOfWeek),
      startMinuteOfDay: ws.startMinute,
      endMinuteOfDay: ws.endMinute,
    }));

    return {
      id: shop.id,
      title: shop.title,
      subTitle: shop.subTitle,
      description: shop.description,
      contactInfo,
      schoolId: shop.schoolId,
      schoolAbbr: shop.school.abbreviation,
      images,
      thumbnailLink: thumbnailLink || '',
      discount: shop.discount,
      address: shop.address,
      longitude: shop.longitude,
      latitude: shop.latitude,
      workSchedules,
      googleMapsLink,

      // 新增欄位
      isOpen,
      distance,
      hotScore: shop.cachedHotScore,
      isSaved,
    };
  }

  private mapIntToWeekday(day: number): Weekday {
    const map = [
      Weekday.SUNDAY,
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
    ];
    return map[day];
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
}
