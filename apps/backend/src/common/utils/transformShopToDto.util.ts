import { ResponseShopDto } from 'src/shops/dto/response-shop.dto';
import { Weekday } from 'src/shops/types/work-schedule.type';
import { env } from './env.utils';
import { ShopWithRelations } from 'src/shops/types/shop-with-relations.type';

function mapIntToWeekday(day: number): Weekday {
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
function calculateDistance(
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

export function transformShopToDto(
  shop: ShopWithRelations,
  userLat?: number,
  userLng?: number,
  currentDay?: number,
  currentMinute?: number,
): ResponseShopDto {
  const R2_PUBLIC_URL = env('R2_PUBLIC_URL');
  // 計算距離
  let distance: number | undefined;
  if (userLat && userLng) {
    distance = calculateDistance(
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
    ? `${R2_PUBLIC_URL}/${shop.thumbnailKey}`
    : images[0]?.thumbnailUrl || null;

  // 修正 Google Maps Link
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;

  // NOTE: contactInfo is already a Json
  const contactInfo = shop.contactInfo as any;

  // WorkSchedules 轉換 (Prisma Model -> DTO)
  const workSchedules = shop.workSchedules.map((ws) => ({
    weekday: mapIntToWeekday(ws.dayOfWeek),
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
