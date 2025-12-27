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
import { Prisma } from '@prisma/client'; // 引入 Prisma 產生的類型
import { ResponseShopDto } from './dto/response-shop.dto';
import { UserPayload } from 'src/auth/types/auth.types';
import { GetShopsDto, ShopSortBy } from './dto/get-shop.dto';
import { transformShopToDto } from 'src/common/utils/transformShopToDto.util';

@Injectable()
export class ShopsService {
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
      transformShopToDto(shop, userLat, userLng, currentDay, currentMinute),
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
    return transformShopToDto(shop);
  }

  async update(id: string, user: UserPayload, updateShopDto: UpdateShopDto) {
    // 1. 取得當前商店資料進行權限檢查
    const currentShop = await this.prisma.shop.findUnique({
      where: { id },
      include: { images: { include: { file: true } } },
    });

    if (!currentShop)
      throw new NotFoundError('SHOP_NOT_FOUND', 'Shop not found.');

    // 權限檢查：僅限同校管理員修改
    if (currentShop.schoolId !== user.schoolId) {
      throw new AuthError('ACCESS_DENIED', 'Modification is forbidden.');
    }

    // 2. 解構資料
    const {
      contactInfo,
      schedules: workSchedules,
      images,
      ...rest
    } = updateShopDto;

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
      // 3. 更新商店基本資料 (不包含 schedules JSON)
      await tx.shop.update({
        where: { id },
        data: {
          ...rest,
          schedules: {},
          contactInfo: contactInfo ? instanceToPlain(contactInfo) : undefined,
        },
      });

      // 4. 更新 WorkSchedules (採用全刪全建策略)
      if (workSchedules) {
        // 先刪除舊的所有排程
        await tx.workSchedule.deleteMany({
          where: { shopId: id },
        });

        // 建立新的排程
        if (workSchedules.length > 0) {
          await tx.workSchedule.createMany({
            data: workSchedules.map((s) => ({
              shopId: id,
              dayOfWeek: WeekdayToInt[s.weekday],
              startMinute: s.startMinuteOfDay,
              endMinute: s.endMinuteOfDay,
            })),
          });
        }
      }

      // 5. 更新圖片 (保留您原本的 Diff 邏輯)
      if (images) {
        const currentImages = currentShop.images;
        const newFileKeys = images.map((img) => img.fileKey);
        const currentFileKeys = currentImages.map((img) => img.file.fileKey);

        // A. 刪除不再需要的圖片關聯
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

        // B. 新增圖片關聯
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

        // C. 更新現有圖片的排序
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
      transformShopToDto(item.shop, undefined, undefined),
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
}
