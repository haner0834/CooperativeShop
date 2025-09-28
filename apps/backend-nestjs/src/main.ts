import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { SuccessResponseInterceptor } from './common/interceptors/response-success.interceptor';
import { GlobalExceptionFilter } from './common/interceptors/response-errpr.interceptor';
import { winstonLoggerOption } from './config/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOption),
  });

  // To behav like what I did in express's response
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
