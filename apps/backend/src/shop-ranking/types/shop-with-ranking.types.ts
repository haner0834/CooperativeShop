export type IdentifierType = 'user' | 'device';
export type RankingType = 'hot' | 'home' | 'nearby';

export interface ShopWithRanking {
  id: string;
  title: string;
  description: string;
  contactInfo: any; // Json
  googleMapsLink: string | null;
  thumbnailLink: string;
  discount: string | null;
  address: string;
  longitude: number;
  latitude: number;
  category: string;
  schoolId: string;
  rank?: number;
  score?: number;
  distance?: number; // in kilometers, for nearby type
}
