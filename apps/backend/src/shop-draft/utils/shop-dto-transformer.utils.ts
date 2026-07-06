import { CreateShopDto } from 'src/shops/dto/create-shop.dto';
import { ShopDraftDto } from '../dto/shop-draft.dto';

export function mapDraftToCreateShopDto(draft: ShopDraftDto): CreateShopDto {
  return {
    title: draft.title,
    subTitle: draft.subtitle ?? undefined,
    description: draft.description,
    contactInfo: draft.contactInfo,

    schoolId: draft.school.id,

    // 圖片狀態過濾與提取
    images: draft.images
      // 只挑選已成功上傳且包含 uploadInfo 的圖片
      .filter((img) => img.status === 'success' && img.uploadInfo)
      .map((img) => ({
        // (!)是安全的，因為上面已經確保 img.uploadInfo 存在
        fileKey: img.uploadInfo!.fileKey,
        thumbnailKey: img.uploadInfo!.thumbnailKey,
      })),

    thumbnailKey: draft.thumbnailKey,
    discount: draft.discount,
    address: draft.address,
    longitude: draft.longitude,
    latitude: draft.latitude,

    // 欄位名稱替換
    schedules: draft.workSchedules,
  };
}
