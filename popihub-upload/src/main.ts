import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  const port = process.env.PORT ?? 1602;
  await app.listen(port, '0.0.0.0');
  console.log(`Application running on:
  Local:   http://localhost:${port}
  Network: http://192.168.1.108:${port}`);
}
bootstrap();
