import { Injectable } from '@nestjs/common';
import nodeHtmlToImage from 'node-html-to-image';
import { InternalError } from 'src/types/error.types';
import {
  InstaPostImageType,
  InstaPostImageResult,
} from './types/insta-post-image-type.types';
import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';
import { images } from 'src/generated/images';
import { templates } from 'src/generated/templates';
import { PostVisualState } from 'src/insta-post/insta-post-sequence.service';
import { ContactInfoDto } from 'src/shops/dto/create-shop.dto';
import { generateScheduleText } from 'src/common/utils/work-schedule.utils';
import { ContactCategory } from 'src/shops/types/contact-info.type';

@Injectable()
export class InstaPostImageService {
  private getTemplate(type: InstaPostImageType): string {
    switch (type) {
      case 'COVER':
        return templates.SHOP_TITLE_TEMPLATE;
      case 'INFO':
        return templates.SHOP_INFO_TEMPLATE;
      case 'DESCRIPTION':
        return templates.SHOP_DESCRIPTION_TEMPLATE;
    }
  }

  private getCoverBg(visualState: PostVisualState): string {
    const key =
      `COVER_${visualState.coverStyle}_${visualState.coverFlip}` as keyof typeof images;
    return images[key];
  }

  private getContentBg(flip: 0 | 1): string {
    const key = `CONTENT_0_${flip}` as keyof typeof images;
    return images[key];
  }

  private getContractString(contactInfo: ContactInfoDto[]) {
    const priorityOrder = [
      ContactCategory.PhoneNumber,
      ContactCategory.Instagram,
      ContactCategory.Website,
    ];

    const infoMap = new Map(contactInfo.map((ci) => [ci.category, ci.content]));

    for (const category of priorityOrder) {
      const content = infoMap.get(category);
      if (content) return content;
    }

    return '無可用聯絡方式';
  }

  async generateInstaPostImages(
    shopInfo: ShopDraftDto,
    visualState: PostVisualState,
  ): Promise<InstaPostImageResult[]> {
    const templatesConfig: Record<InstaPostImageType, Record<string, any>> = {
      COVER: {
        bgImageUrl: this.getCoverBg(visualState),
        storeName: shopInfo.title,
        branchName: shopInfo.subtitle ?? '',
      },
      INFO: {
        bgImageUrl: this.getContentBg(visualState.infoFlip),
        address: shopInfo.address,
        discount: shopInfo.discount ?? '',
        workSchedule: generateScheduleText(shopInfo.workSchedules),
        contact: this.getContractString(shopInfo.contactInfo),
      },
      DESCRIPTION: {
        bgImageUrl: this.getContentBg(visualState.descriptionFlip),
        description: shopInfo.description,
      },
    };

    const keys = Object.keys(templatesConfig) as InstaPostImageType[];

    return Promise.all(
      keys.map(async (type) => {
        const template = this.getTemplate(type);
        const buffer = await this.generateImageBuffer(template, {
          ...templatesConfig[type],
        });

        return { type, buffer };
      }),
    );
  }

  async generateImageBuffer(
    htmlTemplate: string,
    content: Record<string, string>,
  ): Promise<Buffer> {
    try {
      const image = await nodeHtmlToImage({
        html: htmlTemplate,
        content,
        type: 'png',
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      return image as Buffer;
    } catch (error) {
      throw new InternalError('Error generating image');
    }
  }
}
