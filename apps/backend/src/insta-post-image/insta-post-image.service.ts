import { Injectable } from '@nestjs/common';
import nodeHtmlToImage from 'node-html-to-image';
import { InternalError } from 'src/types/error.types';
import {
  InstaPostImageType,
  InstaPostImageResult,
} from './types/insta-post-image-type.types';

import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { ShopDraftDto } from 'src/shop-draft/dto/shop-draft.dto';

@Injectable()
export class InstaPostImageService {
  private async getTemplate(type: InstaPostImageType) {
    return await readFile(
      join(__dirname, `templates/shop-${type.toLowerCase()}.template.html`),
      'utf-8',
    );
  }

  async generateInstaPostImages(
    shopInfo: ShopDraftDto,
  ): Promise<InstaPostImageResult[]> {
    const templatesConfig: Record<InstaPostImageType, Record<string, any>> = {
      COVER: {
        bgBase64Url: '',
        title: shopInfo.title,
        subtitle: shopInfo.subtitle ?? '',
      },
      INFO: {
        bgBase64Url: '',
        address: shopInfo.address,
        discount: shopInfo.discount ?? '',
      },
      DESCRIPTION: {
        bgBase64Url: '',
        description: shopInfo.description,
      },
    };

    const keys = Object.keys(templatesConfig) as InstaPostImageType[];

    return Promise.all(
      keys.map(async (type) => {
        const template = await this.getTemplate(type);
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
