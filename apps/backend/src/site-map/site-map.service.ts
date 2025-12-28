import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class SitemapService {
  // 靜態頁加上 priority 與 changefreq
  private staticRoutes = [
    { path: '/', priority: 0.8, changefreq: 'weekly' },
    { path: '/intro', priority: 0.5, changefreq: 'monthly' },
    { path: '/choose-school', priority: 0.8, changefreq: 'weekly' },
    { path: '/login-hint', priority: 0.3, changefreq: 'monthly' },
    { path: '/login-failed', priority: 0.3, changefreq: 'monthly' },
    { path: '/schools', priority: 0.2, changefreq: 'monthly' },
    { path: '/faq', priority: 0.5, changefreq: 'weekly' },
    { path: '/shops', priority: 1, changefreq: 'daily' },
    { path: '/shops/map', priority: 0.7, changefreq: 'weekly' },
  ];

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async generateSitemap(): Promise<string> {
    const cached = await this.redis.get('sitemap');
    if (cached) return cached;

    const baseUrl = 'https://cooperativeshops.com';

    // 1️⃣ 靜態頁
    const staticUrls = this.staticRoutes
      .map(
        (u) => `<url>
  <loc>${baseUrl}${u.path}</loc>
  <changefreq>${u.changefreq}</changefreq>
  <priority>${u.priority}</priority>
</url>`,
      )
      .join('\n');

    // 2️⃣ schools
    const schools = await this.prisma.school.findMany({
      select: { abbreviation: true },
    });
    const schoolUrls = schools
      .map(
        (s) => `<url>
  <loc>${baseUrl}/schools/${s.abbreviation}</loc>
  <changefreq>monthly</changefreq>
  <priority>0.5</priority>
</url>`,
      )
      .join('\n');

    // 3️⃣ shops
    const shops = await this.prisma.shop.findMany({
      select: { id: true },
    });
    const shopUrls = shops
      .map(
        (s) => `<url>
  <loc>${baseUrl}/shops/${s.id}</loc>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>`,
      )
      .join('\n');

    // 4️⃣ 合併成 XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${schoolUrls}
${shopUrls}
</urlset>`;

    // 5️⃣ 存 Redis 10 分鐘
    await this.redis.set('sitemap', xml, 'EX', 600);

    return xml;
  }
}
