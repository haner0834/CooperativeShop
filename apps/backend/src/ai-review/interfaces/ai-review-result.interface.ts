/**
 * 單一欄位審核結果來源標籤。
 *
 * NOTE: 這是模型「自報」的來源說明，不是外部可查證的引用（citation）。
 * 若之後要接 Google Search Grounding，實際的可查證來源會在
 * response.candidates[0].groundingMetadata 裡，跟這個欄位是兩件事，
 * 目前 parseResponse 尚未處理 groundingMetadata（見 ai-review.service.ts 的 WARN 註記）。
 */
export type AiReviewSource =
  | '合約掃描'
  | '店家提供資料'
  | '官方網站'
  | '官方社群'
  | 'Google Maps'
  | '其他公開資訊'
  | '無法查證';

export interface AiReviewFieldResult {
  isValid: boolean;
  reason: string;
  source: AiReviewSource;
}

export type AiReviewField =
  | 'title'
  | 'subtitle'
  | 'description'
  | 'discount'
  | 'contactInfo'
  | 'location'
  | 'contractScan'
  | 'workSchedules';

export interface AiReviewResult {
  title: AiReviewFieldResult;
  subtitle: AiReviewFieldResult;
  description: AiReviewFieldResult;
  discount: AiReviewFieldResult;
  contactInfo: AiReviewFieldResult;
  location: AiReviewFieldResult;
  /**
   * WARN: ShopDraft 目前尚無合約掃描檔欄位，這個欄位在合約功能上線前
   * 幾乎必然是 isValid=false 且 source='無法查證'（因為 contract payload 永遠是 null）。
   * 這是預期行為，不是 bug。
   */
  contractScan: AiReviewFieldResult;
  workSchedules: AiReviewFieldResult;
  isPassed: boolean;
  summary: string;
  suggestions: Partial<Record<AiReviewField, string>>;
}
