import { CommandFactory } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { CliModule } from './cli/cli.module';

async function bootstrap() {
  await CommandFactory.run(CliModule, new Logger());
}

bootstrap();
