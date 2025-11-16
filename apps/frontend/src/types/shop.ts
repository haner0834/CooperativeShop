import type { Point } from "../pages/ShopRegisterForm/ShopLocationBlock";
import type { WorkSchedule } from "../pages/ShopRegisterForm/ShopWorkSchedulesBlock";
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
    selectedPoint: Point | null;
    address: string;
    contactInfo: Omit<ContactInfo, "icon" | "formatter" | "validator">[];
    workSchedules: WorkSchedule[];
  };
}
