import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonLoggerOption } from './config/winston.config';
import { GlobalExceptionFilter } from './common/interceptors/response-errpr.interceptor';
import { SuccessResponseInterceptor } from './common/interceptors/response-success.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOption),
  });

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  // To behav like what I did in express's response
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
