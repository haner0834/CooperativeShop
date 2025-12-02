import { RankingType, ShopWithRanking } from './shop-with-ranking.types';

export interface CachedRankingData {
  type: RankingType;
  date: string; // ISO date string
  shops: ShopWithRanking[];
  generatedAt: string;
}
