import { School, Shop, ShopDraft, ShopDraftVersion } from '@prisma/client';

export type DraftWithRelations = ShopDraft & {
  school: School;
  shop: Shop | null;
  currentVersion: ShopDraftVersion | null;
};
