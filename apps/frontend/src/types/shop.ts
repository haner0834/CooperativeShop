import type { Point } from "../pages/ShopRegisterForm/ShopLocationBlock";
import type { SelectedImage } from "./selectedImage";

export interface Shop {
  id: string;
  title: string;
  description: string;
  phoneNumbers: string[];
  contactInfo: ContactInfo[];
  googleMapsLink?: string | null;
  imageLinks: string[];
  thumbnailLink: string;
  isOpen: boolean;
  discount?: string | null;
  address: string;
  longitude: number;
  latitude: number;
}

export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface WorkScheduleBackend {
  id: string;
  weekday: Weekday;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
}

// Seperate them because this interface match more to the
// interaction in shop register form.
export interface WorkSchedule {
  weekdays: Weekday[];
  range: [number, number]; // 0 ~ 23.5
}

export const DEFAULT_WORKSCHEDULE: WorkSchedule = {
  weekdays: [],
  range: [8, 17],
};

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
    description: string;
    images: SelectedImage[];
    discount: string;
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
    description: string;
    images: SelectedImage[];
    discount: string;
    selectedPoint: Point | null;
    address: string;
    contactInfo: Omit<ContactInfo, "icon" | "formatter" | "validator">[];
    workSchedules: WorkSchedule[];
  };
}
