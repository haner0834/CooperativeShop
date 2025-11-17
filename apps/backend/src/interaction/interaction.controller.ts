import { Controller, Post, Headers } from '@nestjs/common';
import { InteractionService } from './interaction.service';

@Controller('interaction')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post()
  async recordImpression() {}
}
