import { ShopDraftForReview } from '../interfaces/shop-draft-for-review.interface';

/**
 * WorkScheduleDto 用「一天中的第幾分鐘」(0-1439) 存時間，
 * 這裡轉成 'HH:mm' 字串再送給 AI，方便它跟 Google Maps 上的顯示格式比對，
 * 也符合 prompt 裡「Formatting Differences」規則舉的範例格式。
 */
function minuteOfDayToHHMM(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (minuteOfDay % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 組出送給 Gemini 的 shop_info payload。
 *
 * NOTE: 欄位命名刻意維持跟 ShopDraft 一致（address/longitude/latitude 併成 location），
 * 讓 prompt 端的 Rule 5 (Location) 可以直接吃到完整地址資訊。
 */
export function buildShopInfoPayload(draft: ShopDraftForReview) {
  return {
    title: draft.title,
    subtitle: draft.subtitle ?? '',
    description: draft.description,
    discount: draft.discount ?? null,
    contactInfo: (draft.contactInfo ?? []).map((contact) => ({
      category: contact.category,
      content: contact.content,
      href: contact.href,
    })),
    location: {
      address: draft.address,
      longitude: draft.longitude,
      latitude: draft.latitude,
    },
    // WARN: 彈性營業時間（售完為止等）目前沒有任何欄位可以標記，
    // 每一筆都會被當成固定時段送出，AI 只能照固定時段的規則去比對。
    workSchedules: (draft.workSchedules ?? []).map((schedule) => ({
      weekday: schedule.weekday,
      startTime: minuteOfDayToHHMM(schedule.startMinuteOfDay),
      endTime: minuteOfDayToHHMM(schedule.endMinuteOfDay),
    })),
  };
}

/**
 * NOTE: 目前沒有串接任何公開資訊蒐集流程（例如 Google Search Grounding），
 * 固定回傳 null。若要串接，記得回應會多出 groundingMetadata，
 * 需要另外解析，不要塞進這個欄位裡。
 */
export function buildPublicInfoPayload(_draft: ShopDraftForReview): null {
  return null;
}
