import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import {
  AiReviewGroundingSource,
  AiReviewGroundingSnapshot,
} from '../interfaces/ai-review-grounding-source.interface';

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
 * Stage 2（審核呼叫）沒有 google_search 工具、也不能自己開網頁，
 * 所以這裡給的不能只是一串 URL——`findings` 是 Stage 1 已經整理好、
 * 附上來源類別的研究摘要文字，才是模型真正能拿來跟 shop_info 比對的內容；
 * `knownSources` 純粹是可追溯的原始連結清單，給人工／除錯用。
 *
 * - 這個 draft 從沒 grounding 過（snapshot 是 null）：回傳 null，
 *   prompt 那邊的規則會把相關欄位視為「無法查證」。
 * - 已經 grounding 過：把 Stage 1 存好的 findings + sources 一起餵給模型。
 */
export function buildPublicInfoPayload(
  snapshot: Pick<AiReviewGroundingSnapshot, 'findings' | 'sources'> | null,
): { findings: string; knownSources: AiReviewGroundingSource[] } | null {
  if (!snapshot?.sources?.length) return null;

  return { findings: snapshot.findings, knownSources: snapshot.sources };
}

/**
 * 從 Interactions API 回應的 `steps` timeline 裡，把最後一個
 * `model_output` step 底下所有 text content 串起來，等同 SDK 的
 * `interaction.output_text` convenience。
 *
 * Stage 1（grounding-only，純文字）跟 Stage 2（審核，JSON 文字）
 * 兩種呼叫的回應格式相同，都可以用這個函式取出文字，
 * 差別只在呼叫端要不要再對這段文字做 `JSON.parse`。
 */
export function extractModelOutputText(interactionData: any): string {
  const steps = interactionData?.steps ?? [];
  const modelOutputSteps = steps.filter(
    (step: any) => step?.type === 'model_output',
  );
  const lastModelOutputStep = modelOutputSteps[modelOutputSteps.length - 1];

  return (lastModelOutputStep?.content ?? [])
    .filter((content: any) => content?.type === 'text')
    .map((content: any) => content.text)
    .join('');
}

/**
 * 從 Interactions API 的回應（Interaction 資源，含 `steps` timeline）中，
 * 把這次 google_search grounding 找到的來源整理成 AiReviewGroundingSource[]，
 * 準備存進 ShopDraft.aiGroundingSources。
 *
 * NOTE: Interactions API 不再回傳獨立的 groundingMetadata.groundingChunks，
 * 引用改成「inline」放在 model_output step 底下每個 text content item 的
 * `annotations` 陣列裡（每筆有 uri/title）。這裡把所有 model_output step
 * 的 annotations 蒐集起來，效果等同於舊版的 groundingChunks。
 */
export function extractGroundingSources(
  interactionData: any,
): AiReviewGroundingSource[] {
  const steps = interactionData?.steps ?? [];

  const sources: AiReviewGroundingSource[] = steps
    .filter((step: any) => step?.type === 'model_output')
    .flatMap((step: any) => step?.content ?? [])
    .filter((content: any) => content?.type === 'text')
    .flatMap((content: any) => content?.annotations ?? [])
    .filter((annotation: any) => annotation?.type === 'url_citation')
    // NOTE: Gemini 的 annotation 物件裡是 `url` 欄位，不是 `uri`。
    // 我們自己的 AiReviewGroundingSource interface 沿用 `uri` 這個命名，
    // 這裡只是把讀取來源改對，物件內部欄位名稱不變。
    .map((annotation: any) => ({
      uri: annotation?.url,
      title: annotation?.title,
    }))
    .filter((source: AiReviewGroundingSource) => !!source.uri);

  // 用 uri 去重，避免同一個來源被列好幾次
  const deduped = new Map(sources.map((source) => [source.uri, source]));
  return Array.from(deduped.values());
}

/**
 * 從 Interactions API 回應的 `google_search_call` steps 蒐集這次 Gemini
 * 實際下過的搜尋關鍵字（舊版是 groundingMetadata.webSearchQueries 一次給全部，
 * 新版拆成一個 step 一個查詢）。
 */
export function extractWebSearchQueries(interactionData: any): string[] {
  const steps = interactionData?.steps ?? [];

  return steps
    .filter((step: any) => step?.type === 'google_search_call')
    .flatMap((step: any) => step?.arguments?.queries ?? []);
}
