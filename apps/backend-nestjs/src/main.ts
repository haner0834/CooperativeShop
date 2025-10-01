import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOption } from './config/winston.config';
import { Logger, RequestMethod } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/interceptors/response-errpr.interceptor';
import { SuccessResponseInterceptor } from './common/interceptors/response-success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOption),
  });

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'auth/google/callback', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  // To behav like what I did in express's response
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
