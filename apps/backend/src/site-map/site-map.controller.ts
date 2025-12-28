// src/sitemap/sitemap.controller.ts
import { Controller, Get, Header, Res } from '@nestjs/common';
import { SitemapService } from './site-map.service';
import { type Response } from 'express';

@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Res({ passthrough: false }) res: Response) {
    const sitemap = await this.sitemapService.generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
    res.end();
  }
}
