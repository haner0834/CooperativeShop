export type AiReviewSource =
  | "合約掃描"
  | "店家提供資料"
  | "官方網站"
  | "官方社群"
  | "Google Maps"
  | "其他公開資訊"
  | "無法查證";

export interface AiReviewFieldResult {
  isValid: boolean;
  reason: string;
  source: AiReviewSource;
}

export type AiReviewField =
  | "title"
  | "subtitle"
  | "description"
  | "discount"
  | "contactInfo"
  | "location"
  | "contract"
  | "workSchedules";

export interface AiReviewResult {
  title: AiReviewFieldResult;
  subtitle: AiReviewFieldResult;
  description: AiReviewFieldResult;
  discount: AiReviewFieldResult;
  contactInfo: AiReviewFieldResult;
  location: AiReviewFieldResult;
  contract: AiReviewFieldResult;
  workSchedules: AiReviewFieldResult;
  isPassed: boolean;
  summary: string;
  suggestions: Partial<Record<AiReviewField, string>>;
}
