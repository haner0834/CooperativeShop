import type { ContactInfo, ShopDraft } from "../types/shop";
import { categoryMap } from "./contactInfoMap";

export const getDraft = (id: string): ShopDraft | undefined => {
  const key = "SHOP_DRAFT_" + id;
  const draft = localStorage.getItem(key);
  if (!draft) {
    return undefined;
  }

  const shop = JSON.parse(draft);
  if (!shop) {
    return undefined;
  }

  const { data, ...rest } = shop;
  const { contactInfo: plainContactInfo, ...dataR } = data;

  const contactInfo: ContactInfo[] = plainContactInfo.map(
    (props: Omit<ContactInfo, "validator" | "formatter">) => {
      const { icon, ...rest } = props;
      return {
        icon: categoryMap[props.category].icon,
        ...rest,
        validator: categoryMap[props.category].validator,
        formatter: categoryMap[props.category].formatter,
      };
    }
  );

  const shopDraft: ShopDraft = {
    ...rest,
    data: {
      ...dataR,
      contactInfo,
    },
  };

  return shopDraft;
};
