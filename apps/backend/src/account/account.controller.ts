import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type UserPayload } from 'src/auth/types/auth.types';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Get('sessions')
  @UseGuards(JwtAccessGuard)
  async getSessions(@CurrentUser() user: UserPayload) {
    return this.accountService.getSessions(user.id);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.accountService.revokeSession(user.id, sessionId);
  }
}
