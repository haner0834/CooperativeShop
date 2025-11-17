import { TintedInstagram, Line, Facebook } from "@icons";
import { Phone, Globe, Ellipsis } from "lucide-react";
import type { ContactCategory, ContactInfo } from "../types/shop";

// ========== Phone ==========
export const formatTaiwanPhone = (num: string) => {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
  } else if (digits.startsWith("0800") && digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
  } else if (/^0\d{1,2}/.test(digits)) {
    return digits.replace(/(\d{2,3})(\d{3,4})(\d{3,4})/, "$1-$2-$3");
  }
  return digits;
};

export const validatePhoneNumber = (value: string): string =>
  value.replace(/\D/g, "");

// ========== Instagram ==========
export const formatInstagram = (input: string): string => {
  if (!input) return "";
  let value = input.trim();

  // Handle share link formats like https://www.instagram.com/username/
  value = value
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/$/, ""); // remove trailing slash

  // Remove leading @ if user pasted one (UI already has prefix)
  value = value.replace(/^@+/, "");

  // Only allow valid characters
  value = value.replace(/[^a-zA-Z0-9._]/g, "");

  return value;
};

export const validateInstagram = (input: string): string => {
  return formatInstagram(input).slice(0, 30);
};

// ========== Facebook ==========
export const formatFacebook = (input: string): string => {
  if (!input) return "";
  let value = input.trim();

  // Handle full URLs
  value = value
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
    .replace(/\/$/, "");

  // Remove query params like ?id=...
  value = value.split("?")[0];

  // Keep valid ID characters
  value = value.replace(/[^a-zA-Z0-9._]/g, "");

  return value;
};

export const validateFacebook = (input: string): string =>
  formatFacebook(input).slice(0, 50);

// ========== LINE ==========
export const formatLine = (input: string): string => {
  if (!input) return "";
  let value = input.trim();

  // Remove possible share link
  value = value
    .replace(
      /^https?:\/\/(line\.me\/R\/ti\/p\/|line\.me\/ti\/p\/|line\.me\/R\/@)/i,
      ""
    )
    .replace(/^@+/, "");

  value = value.replace(/[^a-zA-Z0-9._-]/g, "");
  return value;
};

export const validateLine = (input: string): string =>
  formatLine(input).slice(0, 33);

// ========== Website ==========
export const formatWebsite = (input: string): string => {
  if (!input) return "";
  let value = input.trim();

  // Remove protocol — UI doesn't need to show it
  value = value.replace(/^https?:\/\//i, "");

  return value;
};

export const validateWebsite = (input: string): string => {
  let value = input.trim();

  // Keep only safe URL characters, remove protocol
  value = value.replace(/^https?:\/\//i, "").replace(/[^\w\-.:/?#=&%]/g, "");
  return value;
};

// ========== Other ==========
export const formatOther = (value: string): string => value.trim();
export const validateOther = (value: string): string => value.trim();

export const categoryMap: Record<
  ContactCategory,
  Omit<ContactInfo, "category">
> = {
  "phone-number": {
    name: "電話",
    content: "",
    placeholder: "0987654321",
    href: "",
    prefix: "",
    icon: <Phone />,
    formatter: formatTaiwanPhone,
    validator: validatePhoneNumber,
  },
  instagram: {
    name: "Instagram 帳號",
    content: "",
    placeholder: "cooperativeshops_2026",
    href: "",
    prefix: "@",
    icon: <TintedInstagram className="w-6 h-6" />,
    formatter: formatInstagram,
    validator: validateInstagram,
  },
  facebook: {
    name: "Facebook 帳號",
    content: "",
    placeholder: "your.page.name",
    href: "",
    prefix: "",
    icon: <Facebook className="w-6 h-6 text-blue-500" />,
    formatter: formatFacebook,
    validator: validateFacebook,
  },
  line: {
    name: "LINE",
    content: "",
    placeholder: "cooperativeshops",
    href: "",
    prefix: "@",
    icon: <Line className="w-6 h-6 text-green-400" />,
    formatter: formatLine,
    validator: validateLine,
  },
  website: {
    name: "網站",
    content: "",
    placeholder: "cooperativeshops.org",
    href: "",
    prefix: "https://",
    icon: <Globe />,
    formatter: formatWebsite,
    validator: validateWebsite,
  },
  other: {
    name: "其他",
    content: "",
    placeholder: ":D",
    href: "",
    prefix: "",
    icon: <Ellipsis />,
    formatter: formatOther,
    validator: validateOther,
  },
};

export const hrefBuilders: Record<ContactCategory, (value: string) => string> =
  {
    "phone-number": (v) => `tel:${v}`,
    instagram: (v) => `https://www.instagram.com/${v}`,
    facebook: (v) => `https://www.facebook.com/${v}`,
    line: (v) => `https://line.me/R/ti/p/@${v}`,
    website: (v) => `https://${v}`,
    other: (v) => v,
  };
