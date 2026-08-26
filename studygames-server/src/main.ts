import { NestFactory } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const auth = app.get(AuthService);

  // Phục vụ các tệp tĩnh (hình ảnh, favicon...) từ thư mục public
  const publicPath = join(__dirname, '..', 'public');
  const clientPublicPath = join(__dirname, '..', '..', 'studygames-client', 'public');
  app.use(express.static(publicPath));
  app.use(express.static(clientPublicPath));

  // CORS: hỗ trợ nhiều origins hoặc '*' cho phép mọi nguồn
  const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:5000';
  const allowAll = rawOrigins.trim() === '*';
  app.enableCors({
    origin: allowAll ? true : rawOrigins.split(',').map((o) => o.trim()),
    credentials: !allowAll,
  });

  // Auth middleware cho BO dashboard: chỉ cho phép user có role 11 truy cập UI
  const boPath = join(__dirname, '..', 'bo-dist');
  const boAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization as string | undefined;
    const queryToken = req.query.token as string | undefined;
    const raw = header && header.startsWith('Bearer ') ? header.slice(7).trim() : queryToken;

    if (!raw) {
      res.status(401).send('Missing access token');
      return;
    }

    try {
      const payload = await auth.verifyAccessToken(raw);
      if (payload.role !== 11) {
        res.status(403).send('Admin access required');
        return;
      }
      (req as any).user = payload;
      next();
    } catch {
      res.status(401).send('Invalid or expired access token');
    }
  };

  // BO React Dashboard static + SPA fallback
  app.use('/bo', (req, res, next) => {
    if (req.method !== 'GET' || req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }
    return boAuthMiddleware(req, res, next);
  });
  app.use('/bo', express.static(boPath, { index: 'index.html' }));
  app.use('/bo', (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    res.sendFile(join(boPath, 'index.html'));
  });

  app.setGlobalPrefix('api', { exclude: ['public', 'bo'] });

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
