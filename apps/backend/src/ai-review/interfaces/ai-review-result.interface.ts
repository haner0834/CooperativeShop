/**
 * 單一欄位審核結果來源標籤。
 *
 * NOTE: 這是模型「自報」的來源說明，不是外部可查證的引用（citation）。
 * 真正可查證的來源存在 ShopDraft.aiGroundingSources（見
 * ai-review-grounding-source.interface.ts），跟這個欄位是兩件事。
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
  | 'contract'
  | 'workSchedules';

export interface AiReviewResult {
  title: AiReviewFieldResult;
  subtitle: AiReviewFieldResult;
  description: AiReviewFieldResult;
  discount: AiReviewFieldResult;
  contactInfo: AiReviewFieldResult;
  location: AiReviewFieldResult;
  /**
   * 對齊 ShopDraft.contract（合約掃描檔）本身，取代原本的 contractScan。
   * draft.contract 沒有 fileKey 時，這欄必然是 isValid=false 且
   * source='無法查證'（因為根本沒有檔案可以審）。
   */
  contract: AiReviewFieldResult;
  workSchedules: AiReviewFieldResult;
  isPassed: boolean;
  summary: string;
  suggestions: Partial<Record<AiReviewField, string>>;
}
