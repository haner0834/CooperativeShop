import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ShopDraftService } from './shop-draft.service';
import { ShopDraftDto } from './dto/shop-draft.dto';
import { plainToInstance } from 'node_modules/class-transformer/types';
import { ShopDraftLockService } from './services/shop-draft-lock.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { EditLockToken } from './decorators/draft-lock-token.decorator';
import { UpdateFieldDto } from './dto/update-field.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/types/auth.types';
import { PermissionError, UnauthorizedError } from 'src/types/error.types';

@Controller('shop-draft')
export class ShopDraftController {
  constructor(private readonly shopDraftService: ShopDraftService) {}

  @Get('get')
  async get(@Param('id') id: string) {
    const draft = await this.shopDraftService.getDraft(id);

    return plainToInstance(ShopDraftDto, draft, {
      excludeExtraneousValues: true,
    });
  }

  @Put('update-field')
  @UseGuards(JwtAccessGuard)
  async update(
    @Body() dto: UpdateFieldDto,
    @EditLockToken() token: string,
    @CurrentUser() user: UserPayload | null,
  ) {
    if (!user) throw new UnauthorizedError();
    if (!token) throw new PermissionError();

    this.shopDraftService.updateField(
      dto.id,
      user.id,
      token,
      dto.fieldName,
      dto.value,
    );
  }
}
