import type { Point } from "../pages/ShopRegisterForm/ShopLocationBlock";
import type { SelectedImage } from "./selectedImage";
import type {
  WorkScheduleBackend,
  WorkSchedule,
  Weekday,
} from "./workSchedule";

export interface Shop {
  id: string;
  title: string;
  subTitle?: string;
  description: string;
  phoneNumbers: string[];
  contactInfo: ContactInfo[];
  googleMapsLink?: string | null;
  schoolId: string;
  schoolAbbr: string;
  imageLinks: string[];
  thumbnailLink: string;
  isOpen: boolean;
  discount?: string | null;
  address: string;
  longitude: number;
  latitude: number;
  workSchedules: WorkScheduleBackend[];
}

export const DEFAULT_WORKSCHEDULE: WorkSchedule = {
  weekdays: [],
  range: [480, 1020],
};

export function transformSchedules(
  schedules: WorkSchedule[]
): WorkScheduleBackend[] {
  const result: WorkScheduleBackend[] = [];

  schedules.forEach((schedule) => {
    const [startHour, endHour] = schedule.range;
    const startMinuteOfDay = Math.round(startHour * 60);
    const endMinuteOfDay = Math.round(endHour * 60);

    schedule.weekdays.forEach((weekday) => {
      result.push({
        id: crypto.randomUUID(),
        weekday,
        startMinuteOfDay,
        endMinuteOfDay,
      });
    });
  });

  return result;
}

export const weekdayOrder: Weekday[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const getChineseWeekdayName = (weekday: Weekday): string => {
  const zhMap: Record<Weekday, string> = {
    SUN: "週日",
    MON: "週一",
    TUE: "週二",
    WED: "週三",
    THU: "週四",
    FRI: "週五",
    SAT: "週六",
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
  placeholder: string;
  href: string;
  prefix: string;
  icon: React.ReactNode;
  formatter: (original: string) => string;
  validator: (newValue: string) => string;
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
  };
}
