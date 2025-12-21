import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ShopRankingService } from './shop-ranking.service';
import { RankingType } from './types/shop-with-ranking.types';

@Controller('shops/rankings')
export class ShopRankingController {
  constructor(private readonly shopRankingService: ShopRankingService) {}

  // /**
  //  * GET /shops/rankings?type=hot
  //  * GET /shops/rankings?type=home
  //  */
  // @Get()
  // async getShopsWithRankings(@Query('type') type?: string) {
  //   const rankingType = (type || 'home') as RankingType;

  //   if (!['hot', 'home'].includes(rankingType)) {
  //     throw new BadRequestException('Type must be either "hot" or "home"');
  //   }

  //   const data = await this.shopRankingService.getRankingsFromR2(rankingType);

  //   return {
  //     total: data.shops.length,
  //     type: data.type,
  //     date: data.date,
  //     generatedAt: data.generatedAt,
  //     shops: data.shops,
  //   };
  // }

  /**
   * GET /shops/rankings/nearby?lat=25.033&lng=121.565
   */
  // @Get('nearby')
  // async getNearbyShops(@Query('lat') lat?: string, @Query('lng') lng?: string) {
  //   if (!lat || !lng) {
  //     throw new BadRequestException(
  //       'lat and lng query parameters are required',
  //     );
  //   }

  //   const latitude = parseFloat(lat);
  //   const longitude = parseFloat(lng);

  //   if (isNaN(latitude) || isNaN(longitude)) {
  //     throw new BadRequestException('Invalid latitude or longitude');
  //   }

  //   const shops = await this.shopRankingService.calculateNearbyRanking(
  //     latitude,
  //     longitude,
  //   );

  //   return {
  //     total: shops.length,
  //     type: 'nearby',
  //     userLocation: { lat: latitude, lng: longitude },
  //     shops,
  //   };
  // }
}
