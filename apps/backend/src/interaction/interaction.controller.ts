import { Controller, Post, Headers } from '@nestjs/common';
import { InteractionService } from './interaction.service';

@Controller('shps/interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post()
  async recordImpression() {}
}
