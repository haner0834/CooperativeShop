import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SuccessResponseInterceptor } from './common/interceptors/response-success.interceptor';
import { GlobalExceptionFilter } from './common/interceptors/response-errpr.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useLogger(app.get(WINSTON_MODULE_PROVIDER)); // Specify winston logger

  // To behav like what I did in express's response
  app.useGlobalInterceptors(new SuccessResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
