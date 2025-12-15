import { TintedInstagram, Line, Facebook } from "@icons";
import { Phone, Globe, Ellipsis, CircleX } from "lucide-react";
import type { ContactCategory, ContactInfo } from "../types/shop";

// ========== Phone ==========
export const formatTaiwanPhone = (num: string) => {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
  } else if (digits.startsWith("0800") && digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
  } else if (/^0\d{1}/.test(digits)) {
    return digits.replace(/(\d{2})(\d{4})(\d{3})/, "$1-$2-$3");
  }
  // } else if (/^0\d{1,2}/.test(digits)) {
  //   return digits.replace(/(\d{2,3})(\d{3,4})(\d{3,4})/, "$1-$2-$3");
  // }
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
// Helper function: check and santinize URL
const sanitizeUrl = (url: string): string => {
  // 1. URL Protocol Whitelisting: check if start with safe protocols
  const safeProtocols = ["http://", "https://", "mailto:", "tel:"];

  const lowerUrl = url.toLowerCase();

  // 如果不以安全協議開頭，或者是以 'javascript:' 或 'data:' 開頭，則移除協議
  if (
    !safeProtocols.some((p) => lowerUrl.startsWith(p)) ||
    lowerUrl.startsWith("javascript:") ||
    lowerUrl.startsWith("data:")
  ) {
    // 移除開頭的協議，只保留內容。
    // 這確保了即使輸入了 javascript:alert(1)，我們也只留下 alert(1) 作為純文字。
    return url.replace(/^[a-zA-Z]+:\/\//, "");
  }

  // 如果是安全的協議，只清理不安全的 URL 字符 (這在前端通常由瀏覽器處理，但做一次過濾更安全)
  // 此處使用一個更寬鬆的過濾，只刪除控制字元和非法的 URI 字元。
  return url.replace(/[\x00-\x1F\x7F<>]/g, "");
};

// ========== Other ==========

/**
 * 格式化 Other 內容：清理輸入並進行 URL 安全檢查。
 * 這是用於 UI 顯示的內容。
 */
export const formatOther = (value: string): string => {
  if (!value) return "";
  let trimmedValue = value.trim();

  // 嘗試進行 URL 安全清理
  return sanitizeUrl(trimmedValue);
};

/**
 * 驗證 Other 內容：僅進行 trim 和長度限制。
 */
export const validateOther = (value: string): string => {
  return formatOther(value).slice(0, 150);
};

// 輔助函數：檢查一個字符串是否看起來像一個完整的 URL (用於 hrefBuilder)
const isLikelyUrl = (content: string): boolean => {
  // 檢查是否包含有效的 URL 結構 (例如：至少包含一個點和斜線)
  // 或者是以安全協議開頭
  return (
    content.includes(".") ||
    content.toLowerCase().startsWith("http") ||
    content.toLowerCase().startsWith("mailto") ||
    content.toLowerCase().startsWith("tel")
  );
};

export const otherHrefBuilder = (v: string) => {
  // 1. 再次清理輸入 (以防萬一)
  const sanitizedContent = sanitizeUrl(v);

  // 2. 判斷是否構成連結
  if (isLikelyUrl(sanitizedContent)) {
    // 如果看起來是 URL，檢查協議並補上 https://
    if (
      sanitizedContent.toLowerCase().startsWith("http://") ||
      sanitizedContent.toLowerCase().startsWith("https://") ||
      sanitizedContent.toLowerCase().startsWith("mailto:") ||
      sanitizedContent.toLowerCase().startsWith("tel:")
    ) {
      return sanitizedContent; // 已有協議，直接使用
    } else {
      // 沒有協議 (例如：www.example.com)，預設補上 https://
      return `https://${sanitizedContent}`;
    }
  }

  // 如果不是 URL，或者被清理到只剩下純文字，則返回空字串或 `#`
  // 如果返回空字串，前端渲染時應判斷並禁用 <a> 標籤。
  return "";
};

export const categoryMap: Record<
  ContactCategory,
  Omit<ContactInfo, "category">
> = {
  "phone-number": {
    name: "電話",
    content: "",
    inputType: "tel",
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
    inputType: "text",
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
    inputType: "url",
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
    inputType: "text",
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
    inputType: "url",
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
    inputType: "text",
    placeholder: ":D",
    href: "",
    prefix: "",
    icon: <Ellipsis />,
    formatter: formatOther,
    validator: validateOther,
  },
};

export const ContactCategoryIcon = ({
  category,
  className = "",
}: {
  category: ContactCategory;
  className?: string;
}) => {
  switch (category) {
    case "phone-number":
      return <Phone {...{ className }} />;
    case "facebook":
      return <Facebook {...{ className }} />;
    case "instagram":
      return <TintedInstagram {...{ className }} />;
    case "line":
      return <Line {...{ className }} />;
    case "website":
      return <Globe {...{ className }} />;
    case "other":
      return <Ellipsis {...{ className }} />;
    default:
      return <CircleX {...{ className }} />;
  }
};

export const hrefBuilders: Record<ContactCategory, (value: string) => string> =
  {
    "phone-number": (v) => `tel:${v}`,
    instagram: (v) => `https://www.instagram.com/${v}`,
    facebook: (v) => `https://www.facebook.com/${v}`,
    line: (v) => `https://line.me/R/ti/p/@${v}`,
    website: (v) => `https://${v}`,
    other: otherHrefBuilder,
  };

export const buildHref = (category: ContactCategory, content: string) => {
  return hrefBuilders[category](content);
};
