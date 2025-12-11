import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { env } from '../common/utils/env.utils';
import { NotFoundError, BadRequestError } from '../types/error.types';
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
    const encoded = encodeURIComponent(rawData);
    const dataForQr =
      env('FRONTEND_URL_ROOT') + '/qr-verification?code=' + encoded;

    return dataForQr;
  }

  /**
   * 驗證從 QR Code 掃描到的資料
   * @param data 掃描到的 payload
   * @returns {Promise<Omit<QrCodePayload, 'signature'>>} 驗證成功後回傳的使用者公開資料
   */
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
      throw new BadRequestError(
        'QR_SIGNATURE_MISMATCH',
        'Invalid QR Code signature.',
      );
    }

    return { userId, ...publicData };
  }
}
