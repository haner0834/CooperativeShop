import type { UploadedContract } from "../pages/ShopRegisterForm/ShopContractBlock";
import type { Point } from "../pages/ShopRegisterForm/ShopLocationBlock";
import { categoryMap } from "../utils/contactInfoMap";
import type { AiReviewResult } from "./ai-review-result";
import type { ImageDto, SelectedImage } from "./selectedImage";
import type {
  WorkScheduleBackend,
  WorkSchedule,
  Weekday,
} from "./workSchedule";
import { Type } from "class-transformer";

export interface ResponseImageDto {
  fileUrl: string;
  thumbnailUrl: string | null;
}

export type ShopMode = "edit" | "create";

export interface Shop {
  id: string;
  title: string;
  subTitle?: string;
  description: string;
  contactInfo: ContactInfo[];
  googleMapsLink?: string | null;
  schoolId: string;
  schoolAbbr: string;
  images: ResponseImageDto[];
  thumbnailLink: string;
  isOpen: boolean;
  discount: string | null;
  address: string;
  longitude: number;
  latitude: number;
  workSchedules: WorkScheduleBackend[];
  distance?: number;
  hotScore?: number;
  isSaved?: boolean;
}

export interface CreateShopDto {
  title: string;
  subTitle: string | null;
  description: string;
  contactInfo: ContactInfoDto[];
  schoolId: string;
  images: ImageDto[];
  thumbnailKey: string;
  discount: string | null;
  address: string;
  longitude: number;
  latitude: number;
  schedules: WorkScheduleBackend[];
}

export interface ResponseShopDto {
  id: string;
  title: string;
  subTitle: string | null;
  description: string;
  contactInfo: ContactInfoDto[];
  schoolId: string;
  schoolAbbr: string;
  images: ResponseImageDto[];
  thumbnailLink: string;
  isOpen: boolean;
  discount: string | null;
  address: string;
  longitude: number;
  latitude: number;
  workSchedules: WorkScheduleBackend[];
  googleMapsLink: string | null;
  distance?: number;
  hotScore: number;
  isSaved?: boolean;
}

export const fromContactInfoDto = (dto: ContactInfoDto): ContactInfo => {
  const { content, href, ...rest } = categoryMap[dto.category];
  return {
    category: dto.category,
    content: dto.content,
    href: dto.href,
    ...rest,
  };
};

// 轉換函數：將後端 DTO 轉換為前端 Shop 介面
export function transformDtoToShop(dto: ResponseShopDto): Shop {
  // 由於後端 DTO 被設計為盡可能與前端 Shop 介面保持一致，轉換操作極為簡單。
  // 只需要確保所有欄位都存在即可。

  return {
    id: dto.id,
    title: dto.title,
    subTitle: dto.subTitle ?? undefined,
    description: dto.description,
    contactInfo: dto.contactInfo.map(fromContactInfoDto),
    googleMapsLink: dto.googleMapsLink,
    schoolId: dto.schoolId,
    schoolAbbr: dto.schoolAbbr,
    images: dto.images,
    thumbnailLink: dto.thumbnailLink,
    isOpen: dto.isOpen,
    discount: dto.discount,
    address: dto.address,
    longitude: dto.longitude,
    latitude: dto.latitude,
    distance: dto.distance,
    workSchedules: dto.workSchedules,
    isSaved: dto.isSaved,
  };
}

export const DEFAULT_WORKSCHEDULE: WorkSchedule = {
  type: "FIXED",
  weekdays: [],
  range: [480, 1020],
};

export function transformSchedules(
  schedules: WorkSchedule[]
): WorkScheduleBackend[] {
  const result: WorkScheduleBackend[] = [];

  schedules.forEach((schedule) => {
    const [startMinuteOfDay, endMinuteOfDay] = schedule.range;

    schedule.weekdays.forEach((weekday) => {
      result.push({
        type: schedule.type,
        weekday,
        startMinuteOfDay,
        endMinuteOfDay,
      });
    });
  });

  return result;
}

export const weekdayOrder: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const getChineseWeekdayName = (weekday: Weekday): string => {
  const zhMap: Record<Weekday, string> = {
    SUNDAY: "週日",
    MONDAY: "週一",
    TUESDAY: "週二",
    WEDNESDAY: "週三",
    THURSDAY: "週四",
    FRIDAY: "週五",
    SATURDAY: "週六",
  };

  return zhMap[weekday];
};

export type ContactCategory =
  | "phone-number"
  | "instagram"
  | "facebook"
  | "line"
  | "website"
  | "other";

export interface ContactInfo {
  category: ContactCategory;
  name: string;
  content: string;
  inputType: React.HTMLInputTypeAttribute | undefined;
  placeholder: string;
  href: string;
  prefix: string;
  icon: React.ReactNode;
  formatter: (original: string) => string;
  validator: (newValue: string) => string;
}

export interface ContactInfoDto {
  category: ContactCategory;
  content: string;
  href: string;
}

export interface ShopDraft {
  key: string;
  dateISOString: string;
  data: {
    title: string;
    subTitle?: string;
    description: string;
    images: SelectedImage[];
    discount: string;
    schoolId: string;
    schoolAbbr: string;
    selectedPoint: Point | null;
    address: string;
    contactInfo: ContactInfo[];
    workSchedules: WorkSchedule[];
    mode: ShopMode;
  };
}

export type ShopDraftStage =
  | "RESERVED"
  | "EDITING"
  | "SUBMITTED"
  | "ARCHIVED"
  | "APPROVED";

export type ReviewStatus = "IDLE" | "REJECT" | "SUCCESS" | "SUPERSEDED";

export type AiReviewStatus = "APPROVED" | "PENDING" | "REJECTED";

export class ShopDraftVersionDto {
  id: string;
  versionNo: number;
  reviewStatus: ReviewStatus;
  reviewerId: string;
  @Type(() => Date) submittedAt: Date;
  @Type(() => Date) reviewedAt: Date;
  rejectReason?: string;
  aiReviewStatus?: AiReviewStatus;
  @Type(() => Date)
  aiReviewedAt?: Date;
  aiReviewResult?: AiReviewResult;
}

export class AiReviewGroundingSource {
  uri: string;
  title: string;
}

/**
 * 存進 ShopDraft.aiGroundingSources 的完整快照。
 * 除了來源清單外，順便記錄當初的搜尋關鍵字與擷取時間，
 * 方便之後除錯／人工檢視「AI 當初到底查了什麼」。
 */
export class AiReviewGroundingSnapshot {
  fetchedAt: string; // ISO timestamp
  webSearchQueries: string[];
  @Type(() => AiReviewGroundingSource)
  sources: AiReviewGroundingSource[];
  findings: string;
}

export class ShopDraftDto {
  id: string;
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;
  shopId: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  discount: string | null;
  address: string;
  contract: UploadedContract | null;
  longitude: number | null;
  latitude: number | null;
  thumbnailKey: string;
  stage: ShopDraftStage;
  @Type(() => AiReviewGroundingSnapshot)
  aiGroundingSources: AiReviewGroundingSnapshot;
  reservedUntil: Date | null;
  @Type(() => ShopDraftVersionDto)
  currentVersion?: ShopDraftVersionDto;
  versions?: ShopDraftVersionDto[];
  contactInfo: ContactInfoDto[];
  images: SelectedImage[];
  workSchedules: WorkScheduleBackend[];
  submissionNote: string | null;
  school: {
    id: string;
    abbr?: string;
    name?: string;
  };
}

export interface PersistentShopDraft {
  key: string;
  dateISOString: string;
  data: {
    title: string;
    subTitle?: string;
    description: string;
    images: SelectedImage[];
    discount: string;
    schoolId: string;
    schoolAbbr: string;
    selectedPoint: Point | null;
    address: string;
    contactInfo: Omit<ContactInfo, "icon" | "formatter" | "validator">[];
    workSchedules: WorkSchedule[];
    mode: ShopMode;
  };
}
