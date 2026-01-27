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

export const appendRecentShopsToLS = (newShop: Shop) => {
  try {
    const item = localStorage.getItem(RECENT_SHOPS_KEY);
    const originalShops: Shop[] = item ? JSON.parse(item) : [];

    if (!Array.isArray(originalShops)) return;

    // Remove the shop if it already exists to avoid duplicates
    const filteredShops = originalShops.filter(
      (shop) => shop.id !== newShop.id
    );

    filteredShops.unshift(newShop);

    const recentShops = filteredShops.slice(0, MAX_RECENT_SHOPS);

    localStorage.setItem(RECENT_SHOPS_KEY, JSON.stringify(recentShops));
  } catch (err) {
    console.error("Failed to append recent shop:", err);
  }
};
