import { Body, Controller, Post } from '@nestjs/common';
import { QrCodePayload, QrService } from './qr.service';
import { VerifyUserQrDto } from './dto/verify-user-data.dto';
import { BadRequestError } from 'src/types/error.types';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('verify')
  async verify(@Body() body: VerifyUserQrDto) {
    const { data } = body;

    if (!data) {
      throw new BadRequestError('QR code data is missing or not a string');
    }

    let qrData: QrCodePayload;
    try {
      const decoded = decodeURIComponent(data);
      qrData = JSON.parse(decoded);
    } catch (err) {
      throw new BadRequestError('Invalid QR code payload');
    }

    const { signature, schoolAbbreviation, schoolName, userId } = qrData;
    if (!signature || !schoolAbbreviation || !schoolName || !userId) {
      throw new BadRequestError('Incomplete QR code payload');
    }

    // 呼叫 Service 驗證 QR
    const verifiedData = await this.qrService.verifyQRCodeData(qrData);

    return verifiedData;
  }
}
