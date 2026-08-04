import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import { AiReviewGroundingSource } from '../interfaces/ai-review-grounding-source.interface';

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
export function buildShopInfoPayload(draft: ShopDraftDto) {
  return {
    title: draft.title,
    subtitle: draft.subtitle ?? '',
    description: draft.description,
    discount: draft.discount ?? null,
    contactInfo: draft.contactInfo ?? [],
    location: {
      address: draft.address,
      longitude: draft.longitude,
      latitude: draft.latitude,
    },
    workSchedules: (draft.workSchedules ?? []).map((schedule) => ({
      weekday: schedule.weekday,
      startTime: minuteOfDayToHHMM(schedule.startMinuteOfDay),
      endTime: minuteOfDayToHHMM(schedule.endMinuteOfDay),
      type: schedule.type,
      scheduleNote: schedule.scheduleNote ?? null,
    })),
  };
}

/**
 * 組出送給 Gemini 的 public_info payload。
 *
 * - 第一次審核（sources 是空陣列）：回傳 null，並改用 googleSearch tool
 *   讓 Gemini 自己去查，查完的結果由 extractGroundingSources 存起來。
 * - 第二次以後：不再啟用 googleSearch（省錢），改把上次存好的來源清單
 *   直接餵給模型當作既有的公開資訊依據。
 */
export function buildPublicInfoPayload(
  sources: AiReviewGroundingSource[],
): { knownSources: AiReviewGroundingSource[] } | null {
  if (!sources.length) return null;

  return { knownSources: sources };
}

/**
 * 從 Gemini generateContent 的回應中，把這次 googleSearch grounding
 * 找到的來源整理成 AiReviewGroundingSource[]，準備存進
 * ShopDraft.aiGroundingSources。
 *
 * NOTE: groundingChunks 只有 uri/title，沒有內文摘要，
 * 所以「重複使用」的效果是讓 Gemini 知道上次查到哪些頁面，
 * 而不是完整重播上次搜尋到的內容。
 */
export function extractGroundingSources(
  geminiResponseData: any,
): AiReviewGroundingSource[] {
  const chunks =
    geminiResponseData?.candidates?.[0]?.groundingMetadata?.groundingChunks ??
    [];

  const sources: AiReviewGroundingSource[] = chunks
    .map((chunk: any) => ({
      uri: chunk?.web?.uri,
      title: chunk?.web?.title,
    }))
    .filter((source: AiReviewGroundingSource) => !!source.uri);

  // 用 uri 去重，避免同一個來源被列好幾次
  const deduped = new Map(sources.map((source) => [source.uri, source]));
  return Array.from(deduped.values());
}

export function extractWebSearchQueries(geminiResponseData: any): string[] {
  return (
    geminiResponseData?.candidates?.[0]?.groundingMetadata?.webSearchQueries ??
    []
  );
}
