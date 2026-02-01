import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CachedRankingData } from './types/cached-ranking-data.types';
import { ShopEngagementMetrics } from './types/shop-engagement-metrics.types';
import { ShopWithRanking, RankingType } from './types/shop-with-ranking.types';
import { env } from 'src/common/utils/env.utils';
import { log1p, mean, std, zScore } from 'src/common/utils/math.utils';
import { HotScoreStats } from './types/hot-score-stat.types';

@Injectable()
export class ShopRankingService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly R2_PUBLIC_URL = env('R2_PUBLIC_URL');

  /**
   * Main cron jobs
   */
  async calculateAndUploadHotRankings(): Promise<void> {
    try {
      await this.calculateHotShopsRanking();
    } catch (error) {
      throw error;
    }
  }

  async calculateAndUploadHomeRankings(): Promise<void> {
    try {
      await this.calculateHomeRanking();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate Hot Shops ranking (last 7 days)
   */
  private async calculateHotShopsRanking(): Promise<void> {
    const today = this.getTodayDate();
    const sevenDaysAgo = this.getDateDaysAgo(7);

    const metrics = await this.getShopMetrics(sevenDaysAgo, today);
    const activeMetrics = metrics.filter((x) => x.impressions > 0);

    const hotScoreStats = this.calculateHotScoreStats(activeMetrics);

    const hotScores = metrics
      .map((m) => ({
        shopId: m.shopId,
        score: this.calculateHotScore(m, hotScoreStats),
        rank: 0,
      }))
      .filter((s) => s.score > 0);

    hotScores.sort((a, b) => b.score - a.score);
    hotScores.forEach((shop, index) => {
      shop.rank = index + 1;
    });

    await this.saveRankings('hot', hotScores);
  }

  /**
   * Calculate Home ranking (balanced)
   */
  private async calculateHomeRanking(): Promise<void> {
    const today = this.getTodayDate();
    const sevenDaysAgo = this.getDateDaysAgo(7);

    const metrics = await this.getShopMetrics(sevenDaysAgo, today);
    const allShops = await this.prisma.shop.findMany({
      select: { id: true },
    });

    const homeScores = allShops.map((shop) => {
      const metric = metrics.find((m) => m.shopId === shop.id);

      return {
        shopId: shop.id,
        score: this.calculateHomeScore(metric),
        rank: 0,
      };
    });

    homeScores.sort((a, b) => b.score - a.score);
    homeScores.forEach((shop, index) => {
      shop.rank = index + 1;
    });

    await this.saveRankings('home', homeScores);
  }

  /**
   * Scoring algorithms
   */
  private calculateHotScore(
    metrics: ShopEngagementMetrics,
    stats: HotScoreStats,
  ): number {
    if (metrics.impressions === 0) return 0;

    const conversionRate = metrics.views > 0 ? metrics.taps / metrics.views : 0; // 0~1

    const logMetrics = {
      impressions: log1p(metrics.impressions),
      views: log1p(metrics.views),
      taps: log1p(metrics.taps),
      avgViewDuration: log1p(metrics.avgViewDuration),
      uniqueUsers: log1p(metrics.uniqueUsers),
      conversionRate,
    };

    const z = {
      impressions: zScore(
        logMetrics.impressions,
        stats.impressions.mean,
        stats.impressions.std,
      ),
      views: zScore(logMetrics.views, stats.views.mean, stats.views.std),
      taps: zScore(logMetrics.taps, stats.taps.mean, stats.taps.std),
      avgViewDuration: zScore(
        logMetrics.avgViewDuration,
        stats.avgViewDuration.mean,
        stats.avgViewDuration.std,
      ),
      uniqueUsers: zScore(
        logMetrics.uniqueUsers,
        stats.uniqueUsers.mean,
        stats.uniqueUsers.std,
      ),
      conversionRate: zScore(
        logMetrics.conversionRate,
        stats.conversionRate.mean,
        stats.conversionRate.std,
      ),
    };

    const weights = {
      impressions: 0.1,
      views: 0.2,
      taps: 0.25,
      avgViewDuration: 0.15,
      uniqueUsers: 0.2,
      conversionRate: 0.1,
    };

    const rawScore =
      z.impressions * weights.impressions +
      z.views * weights.views +
      z.taps * weights.taps +
      z.avgViewDuration * weights.avgViewDuration +
      z.uniqueUsers * weights.uniqueUsers +
      z.conversionRate * weights.conversionRate;

    const k = 1.2; // z-score 尺度下建議 0.8~1.5
    const sigmoid = 1 / (1 + Math.exp(-k * rawScore));

    return sigmoid * 100;
  }

  private calculateHomeScore(metrics?: ShopEngagementMetrics): number {
    let score = 0;

    // 40% Engagement
    if (metrics && metrics.impressions > 0) {
      score += this.calculateHotScore(metrics) * 0.4;
    }

    // 30% Fairness (lower impression = higher boost)
    const impressions = metrics?.impressions || 0;
    const fairnessBoost = Math.max(0, 100 - impressions);
    score += fairnessBoost * 0.3;

    // 30% Base score for all shops (ensures everyone gets some visibility)
    const randomBoost = Math.random() * 100;
    score += randomBoost * 0.3;

    // Penalty for non-engaging shops
    if (metrics && metrics.impressions > 50 && metrics.views === 0) {
      score *= 0.7;
    }

    return score;
  }

  private calculateHotScoreStats(
    metricsList: ShopEngagementMetrics[],
  ): HotScoreStats {
    const data = metricsList.map((m) => {
      const conversionRate = m.views > 0 ? m.taps / m.views : 0;

      return {
        impressions: log1p(m.impressions),
        views: log1p(m.views),
        taps: log1p(m.taps),
        avgViewDuration: log1p(m.avgViewDuration),
        uniqueUsers: log1p(m.uniqueUsers),
        conversionRate, // 0~1
      };
    });

    const impressions = data.map((d) => d.impressions);
    const views = data.map((d) => d.views);
    const taps = data.map((d) => d.taps);
    const avgViewDuration = data.map((d) => d.avgViewDuration);
    const uniqueUsers = data.map((d) => d.uniqueUsers);
    const conversionRate = data.map((d) => d.conversionRate);

    // μ / σ
    const stats = {
      impressions: {
        mean: mean(impressions),
        std: std(impressions, mean(impressions)),
      },
      views: {
        mean: mean(views),
        std: std(views, mean(views)),
      },
      taps: {
        mean: mean(taps),
        std: std(taps, mean(taps)),
      },
      avgViewDuration: {
        mean: mean(avgViewDuration),
        std: std(avgViewDuration, mean(avgViewDuration)),
      },
      uniqueUsers: {
        mean: mean(uniqueUsers),
        std: std(uniqueUsers, mean(uniqueUsers)),
      },
      conversionRate: {
        mean: mean(conversionRate),
        std: std(conversionRate, mean(conversionRate)),
      },
    };

    return stats;
  }

  /**
   * Get aggregated metrics - optimized for Supabase free tier
   */
  private async getShopMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<ShopEngagementMetrics[]> {
    const DECAY_FACTOR = 0.9057;
    const today = this.getTodayDate().getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const stats = await this.prisma.shopDailyStat.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    const shopMap = new Map<string, ShopEngagementMetrics>();

    for (const stat of stats) {
      const daysAgo = Math.floor(
        Math.abs(today - stat.date.getTime()) / MS_PER_DAY,
      );
      const weight = Math.pow(DECAY_FACTOR, daysAgo);

      const existing: ShopEngagementMetrics = shopMap.get(stat.shopId) || {
        shopId: stat.shopId,
        impressions: 0,
        views: 0,
        taps: 0,
        totalViewTime: 0,
        uniqueUsers: 0,
        impressionToViewRate: 0,
        viewToTapRate: 0,
        avgViewDuration: 0,
      };

      existing.impressions += (stat.impressions || 0) * weight;
      existing.views += (stat.views || 0) * weight;
      existing.taps += (stat.taps || 0) * weight;
      existing.totalViewTime += (stat.viewTimeSec || 0) * weight;

      shopMap.set(stat.shopId, existing);
    }

    const uniqueUsers = await this.prisma.userShopDailyInteraction.groupBy({
      by: ['shopId'],
      where: { date: { gte: startDate, lte: endDate } },
      _count: { identifier: true },
    });
    const userCountMap = new Map(
      uniqueUsers.map((u) => [u.shopId, u._count.identifier]),
    );

    return Array.from(shopMap.values()).map((shop) => {
      const impressions = shop.impressions;
      const views = shop.views;
      const taps = shop.taps;
      const totalViewTime = shop.totalViewTime;
      const uniqueUsers = userCountMap.get(shop.shopId) || 0;

      return {
        shopId: shop.shopId,
        impressions,
        views,
        taps,
        totalViewTime,
        uniqueUsers,
        impressionToViewRate: impressions > 0 ? views / impressions : 0,
        viewToTapRate: views > 0 ? taps / views : 0,
        avgViewDuration: views > 0 ? totalViewTime / views : 0,
      };
    });
  }

  /**
   * Save rankings to database
   */
  private async saveRankings(
    type: RankingType,
    scores: Array<{ shopId: string; score: number; rank: number }>,
  ): Promise<void> {
    const today = this.getTodayDate();

    await this.prisma.$transaction([
      ...scores.map((score) =>
        this.prisma.shopRanking.upsert({
          where: {
            shopId_type_date: {
              shopId: score.shopId,
              type,
              date: today,
            },
          },
          create: {
            shopId: score.shopId,
            type,
            date: today,
            rank: score.rank,
            score: score.score,
          },
          update: {
            rank: score.rank,
            score: score.score,
          },
        }),
      ),
      ...scores.map((score) =>
        this.prisma.shop.update({
          where: { id: score.shopId },
          data: {
            [type === 'hot' ? 'cachedHotScore' : 'cachedHomeScore']:
              score.score,
          },
        }),
      ),
    ]);
  }

  /**
   * Helper: Get today's date at 00:00:00
   */
  private getTodayDate(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Helper: Get date N days ago at 00:00:00
   */
  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
