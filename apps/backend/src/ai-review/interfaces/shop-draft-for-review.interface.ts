import { ContractDto } from 'src/shop-draft/dto/shop-draft.dto';
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
  longitude: number | null;
  latitude: number | null;
  contract: ContractDto;
}
