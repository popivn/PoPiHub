import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.use(json({ limit: '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const distAssets = join(__dirname, '..', 'assets');
  const srcAssets = join(process.cwd(), 'src', 'assets');
  const assetsDir = existsSync(distAssets) ? distAssets : srcAssets;
  app.useStaticAssets(assetsDir);

  // Serve banners directory explicitly
  const bannersDir = join(assetsDir, 'banners');
  if (existsSync(bannersDir)) {
    app.useStaticAssets(bannersDir, { prefix: '/banners/' });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
