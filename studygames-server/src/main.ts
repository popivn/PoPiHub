import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: hỗ trợ nhiều origins hoặc '*' cho phép mọi nguồn
  const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const allowAll = rawOrigins.trim() === '*';
  app.enableCors({
    origin: allowAll ? true : rawOrigins.split(',').map((o) => o.trim()),
    credentials: !allowAll,
  });

  // Log mọi request đến (method, url, status, response time)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.url} - ${res.statusCode} - ${ms}ms`);
    });
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
