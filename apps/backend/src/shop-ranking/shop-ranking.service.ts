import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CachedRankingData } from './types/cached-ranking-data.types';
import { ShopEngagementMetrics } from './types/shop-engagement-metrics.types';
import { ShopWithRanking, RankingType } from './types/shop-with-ranking.types';
import { env } from 'src/common/utils/env.utils';

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

    const hotScores = metrics
      .map((m) => ({
        shopId: m.shopId,
        score: this.calculateHotScore(m),
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
   * Calculate Nearby ranking based on user location
   * On-demand calculation
   */
  async calculateNearbyRanking(
    userLat: number,
    userLng: number,
  ): Promise<ShopWithRanking[]> {
    // Get all shops
    const shops = await this.prisma.shop.findMany();

    // Calculate distance for each shop
    const shopsWithDistance = shops.map((shop) => {
      const distance = this.calculateDistance(
        userLat,
        userLng,
        shop.latitude,
        shop.longitude,
      );

      return {
        ...shop,
        distance,
      };
    });

    // Get recent engagement metrics
    const today = this.getTodayDate();
    const sevenDaysAgo = this.getDateDaysAgo(7);
    const metrics = await this.getShopMetrics(sevenDaysAgo, today);

    // Calculate nearby score
    const nearbyScores = shopsWithDistance.map((shop) => {
      const metric = metrics.find((m) => m.shopId === shop.id);
      const score = this.calculateNearbyScore(shop.distance, metric);
      const thumbnailLink = this.R2_PUBLIC_URL + '/' + shop.thumbnailKey;

      return {
        id: shop.id,
        title: shop.title,
        description: shop.description,
        contactInfo: shop.contactInfo,
        thumbnailLink,
        discount: shop.discount,
        address: shop.address,
        longitude: shop.longitude,
        latitude: shop.latitude,
        schoolId: shop.schoolId,
        distance: shop.distance,
        score,
        rank: 0,
      };
    });

    // Sort by score
    nearbyScores.sort((a, b) => b.score - a.score);
    nearbyScores.forEach((shop, index) => {
      shop.rank = index + 1;
    });

    return nearbyScores;
  }

  /**
   * Scoring algorithms
   */
  private calculateHotScore(metrics: ShopEngagementMetrics): number {
    if (metrics.impressions === 0) return 0;

    const weights = {
      impressions: 1,
      views: 5,
      taps: 10,
      avgViewDuration: 2,
      conversionRate: 15,
    };

    const conversionRate = metrics.taps / metrics.impressions;
    const SHOP_COUNT = 300; // NOTE: Remember to update this data
    const normalizedViewDuration = Math.min(
      metrics.avgViewDuration / SHOP_COUNT,
      1,
    );

    return (
      metrics.impressions * weights.impressions +
      metrics.views * weights.views +
      metrics.taps * weights.taps +
      normalizedViewDuration * 100 * weights.avgViewDuration +
      conversionRate * 100 * weights.conversionRate
    );
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

  private calculateNearbyScore(
    distanceKm: number,
    metrics?: ShopEngagementMetrics,
  ): number {
    // Distance score: closer = higher
    const maxDistance = 5; // km
    const distanceScore = Math.max(0, 100 * (1 - distanceKm / maxDistance));

    // Engagement boost
    let engagementBoost = 0;
    if (metrics && metrics.impressions > 0) {
      const hotScore = this.calculateHotScore(metrics);
      engagementBoost = Math.min(50, hotScore / 10);
    }

    return distanceScore * 0.8 + engagementBoost * 0.1;
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
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
