import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { QrCodePayload, QrService } from './qr.service';
import { VerifyUserQrDto } from './dto/verify-user-data.dto';
import { BadRequestError } from 'src/types/error.types';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import type { UserPayload } from 'src/auth/types/auth.types';

@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('verify')
  async verify(@Body() body: VerifyUserQrDto) {
    const { data } = body;

    if (!data) {
      throw new BadRequestError(
        'INVALID_QR_DATA',
        'QR code data is missing or not a string',
      );
    }

    let qrData: QrCodePayload;
    try {
      const decoded = decodeURIComponent(data);
      qrData = JSON.parse(decoded);
    } catch (err) {
      throw new BadRequestError(
        'INVALID_QR_PAYLOAD',
        'Invalid QR code payload',
      );
    }

    const { signature, schoolAbbreviation, schoolName, userId } = qrData;
    if (!signature || !schoolAbbreviation || !schoolName || !userId) {
      throw new BadRequestError(
        'INCOMPLETE_QR_PAYLOAD',
        'Incomplete QR code payload',
      );
    }

    // 呼叫 Service 驗證 QR
    const verifiedData = await this.qrService.verifyQRCodeData(qrData);

    return verifiedData;
  }

  @Get('generate-data')
  @UseGuards(JwtAccessGuard)
  async generateData(@CurrentUser() user: UserPayload) {
    const data = this.qrService.generateQRCodeData(user.id);
    return data;
  }
}
