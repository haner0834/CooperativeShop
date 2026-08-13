import { Controller, Get } from '@nestjs/common';
import { InstaPostService } from './insta-post.service';
import { ContactCategory } from 'src/shops/types/contact-info.type';
import { Weekday } from 'src/shops/types/work-schedule.type';

@Controller('insta-post')
export class InstaPostController {
  constructor(private readonly instaPostService: InstaPostService) {}

  @Get('test')
  async testImageGen() {
    await this.instaPostService.schedulePostFromShop({
      id: 'TEST_DRAFT_ID',
      createdAt: new Date(),
      updatedAt: new Date(),
      shopId: 'TEST_SHOP_ID',
      title: '店名店名店名',
      subtitle: '分店名',
      normalizedKey: '',
      aiGroundingSources: '',
      description:
        '介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹介紹',
      discount: '優惠會會會會會',
      address: '台南市東區復興國小',
      longitude: null,
      latitude: null,
      thumbnailKey: '',
      stage: 'RESERVED',
      reservedUntil: null,
      contactInfo: [
        {
          category: ContactCategory.PhoneNumber,
          content: '0987654321',
          href: '',
        },
        {
          category: ContactCategory.Instagram,
          content: 'cooperativeshops_2026',
          href: '',
        },
      ],
      images: [],
      workSchedules: [
        {
          weekday: Weekday.MONDAY,
          startMinuteOfDay: 8 * 60,
          endMinuteOfDay: 14 * 60,
          type: 'FIXED',
          scheduleNote: '售完為止',
        },
        {
          weekday: Weekday.TUESDAY,
          startMinuteOfDay: 8 * 60,
          endMinuteOfDay: 14 * 60,
          type: 'FIXED',
          scheduleNote: '售完為止',
        },
        {
          weekday: Weekday.WEDNESDAY,
          startMinuteOfDay: 8 * 60,
          endMinuteOfDay: 14 * 60,
          type: 'FIXED',
          scheduleNote: '售完為止',
        },
        {
          weekday: Weekday.THURSDAY,
          startMinuteOfDay: 8 * 60,
          endMinuteOfDay: 14 * 60,
          type: 'FIXED',
          scheduleNote: '售完為止',
        },
        {
          weekday: Weekday.MONDAY,
          startMinuteOfDay: 17 * 60,
          endMinuteOfDay: 22 * 60,
          type: 'FIXED',
          scheduleNote: null,
        },
        {
          weekday: Weekday.TUESDAY,
          startMinuteOfDay: 17 * 60,
          endMinuteOfDay: 22 * 60,
          type: 'FIXED',
          scheduleNote: null,
        },
        {
          weekday: Weekday.WEDNESDAY,
          startMinuteOfDay: 17 * 60,
          endMinuteOfDay: 22 * 60,
          type: 'FIXED',
          scheduleNote: null,
        },
        {
          weekday: Weekday.THURSDAY,
          startMinuteOfDay: 17 * 60,
          endMinuteOfDay: 22 * 60,
          type: 'FIXED',
          scheduleNote: null,
        },
        {
          weekday: Weekday.FRIDAY,
          startMinuteOfDay: 17 * 60,
          endMinuteOfDay: 22 * 60,
          type: 'FIXED',
          scheduleNote: null,
        },
      ],
      submissionNote: null,
    });
  }
}
