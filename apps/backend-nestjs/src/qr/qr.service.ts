import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { createHmac } from 'crypto';
import { env } from '../common/utils/env.utils';
import {
  NotFoundError,
  BadRequestError,
  InternalError,
} from '../types/error.types';
import QRCodeStyling from 'qr-code-styling';
import fs from 'fs';
import nodeCanvas from 'canvas';
import { JSDOM } from 'jsdom';
import { Log } from 'src/common/decorators/logger.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

export interface QrCodePayload {
  userId: string;
  schoolName: string;
  schoolAbbreviation: string;
  signature: string;
}

@Injectable()
export class QrService {
  constructor(private prisma: PrismaService) {}

  private readonly SIGNATURE_SECRET = env('SIGNATURE_SECRET');

  private generateSignature(
    payload: Omit<QrCodePayload, 'signature'>,
    userSalt: string,
  ): string {
    const dataToSign = [
      payload.userId,
      payload.schoolName,
      payload.schoolAbbreviation,
      userSalt,
    ].join(':');

    const hmac = createHmac('sha256', this.SIGNATURE_SECRET);
    hmac.update(dataToSign);
    return hmac.digest('hex');
  }

  @Log()
  async generateQRCodeData(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { school: true },
    });

    if (!user || !user.school) {
      throw new NotFoundError('User');
    }

    const payload: Omit<QrCodePayload, 'signature'> = {
      userId: user.id,
      schoolName: user.school.name,
      schoolAbbreviation: user.school.abbreviation,
    };

    const signature = this.generateSignature(payload, user.salt);

    const rawData = JSON.stringify({ ...payload, signature });
    const dataForQr = encodeURIComponent(rawData);

    return dataForQr;
  }

  /**
   * 生成使用者 QR Code 圖片
   * @param userId 登入的使用者 ID
   * @returns {Promise<Buffer>} QR Code 圖片的 Buffer
   */
  @Log()
  async generateQRCodeImage(userId: string): Promise<Buffer> {
    const dataForQr = await this.generateQRCodeData(userId);

    const qrCode = new QRCodeStyling({
      width: 600,
      height: 600,
      type: 'canvas',
      data: dataForQr,
      margin: 0,
      dotsOptions: {
        type: 'rounded',
        color: '#6a1a4c',
        gradient: {
          type: 'linear',
          rotation: 0.7853981633974483,
          colorStops: [
            { offset: 0, color: '#0056d6' },
            { offset: 1, color: '#00c7fc' },
          ],
        },
      },
      image: 'https://cooperativeshops.org/logo-small.jpg',
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 15 },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'extra-rounded', color: '#0056d6' },
      cornersDotOptions: { type: 'dot', color: '#0056d6' },
      nodeCanvas,
      jsdom: JSDOM,
    });

    const buffer = await qrCode.getRawData('png');
    if (!(buffer instanceof Buffer)) {
      throw new InternalError(
        'Expected QR code data to be a Buffer in Node.js',
      );
    }

    if (env('NODE_ENV') === 'development')
      await fs.promises.writeFile('qr.png', buffer);

    return buffer;
  }

  /**
   * 驗證從 QR Code 掃描到的資料
   * @param data 掃描到的 payload
   * @returns {Promise<Omit<QrCodePayload, 'signature'>>} 驗證成功後回傳的使用者公開資料
   */
  @Log()
  async verifyQRCodeData(
    data: QrCodePayload,
  ): Promise<Omit<QrCodePayload, 'signature'>> {
    const { signature: receivedSignature, userId, ...publicData } = data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { salt: true },
    });

    if (!user) {
      throw new NotFoundError('User', 'User specified in QR code not found.');
    }

    const { signature, ...payload } = data;

    // Regenerate signature
    const expectedSignature = this.generateSignature(payload, user.salt);

    // Compare signature
    if (expectedSignature !== receivedSignature) {
      throw new BadRequestError('Invalid QR Code signature.');
    }

    return { userId, ...publicData };
  }
}
