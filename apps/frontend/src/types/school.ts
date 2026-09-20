import type { Shop } from "./shop";

export interface School {
  id: string;
  name: string;
  abbreviation: string;
  loginMethod: LoginMethod;
  instagramAccount: string | null;
  iconUrl: string;
  websiteUrl: string | null;
  shops: Shop[];
  usersCount: number;
  shopsCount: number;
}

export type LoginMethod = "credential" | "google";
