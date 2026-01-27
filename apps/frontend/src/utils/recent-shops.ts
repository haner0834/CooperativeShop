import type { Shop } from "../types/shop";

const RECENT_SHOPS_KEY = "recent_shops_v1";
const MAX_RECENT_SHOPS = 10;

export const getRecentShopsFromLS = (): Shop[] => {
  try {
    const item = localStorage.getItem(RECENT_SHOPS_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};
