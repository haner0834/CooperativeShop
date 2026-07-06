import { ContactInfo } from 'src/shops/types/contact-info.type';
import { WorkSchedule } from 'src/shops/types/work-schedule.type';

/**
 * AiReviewService 需要的最小欄位集合。
 * 刻意不要求整個 ShopDraft Prisma model 或 ShopDraftDto，
 * 讓呼叫方（審核流程模組）可以用查出來的 entity 直接餵進來，
 * 只要形狀符合即可，減少跨模組的型別耦合。
 */
export interface ShopDraftForReview {
  title: string;
  subtitle: string | null;
  description: string;
  discount: string | null;
  contactInfo: ContactInfo[];
  workSchedules: WorkSchedule[];
  address: string;
  longitude: number;
  latitude: number;

  /**
   * WARN: Prisma schema (ShopDraft) 目前沒有合約掃描檔對應欄位。
   * 這裡先放一個可選欄位卡位，等合約上傳功能做好之後，
   * 這裡應該會變成類似 contractFileKey / contractFileUrl 這種東西，
   * 並且 AiReviewService 要改成真的把檔案內容送進 Gemini。
   */
  contractFileUrl?: string | null;
}
