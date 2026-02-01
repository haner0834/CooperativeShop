export interface HotScoreStats {
  impressions: { mean: number; std: number };
  views: { mean: number; std: number };
  taps: { mean: number; std: number };
  avgViewDuration: { mean: number; std: number };
  uniqueUsers: { mean: number; std: number };
  conversionRate: { mean: number; std: number };
}
