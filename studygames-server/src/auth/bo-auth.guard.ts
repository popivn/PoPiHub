import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class BoAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const header = req.headers['authorization'] as string | undefined;
    const queryToken = req.query['token'] as string | undefined;

    const raw = header && header.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : queryToken;

    if (!raw) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = await this.auth.verifyAccessToken(raw);

    if (payload.role !== 11) {
      throw new ForbiddenException('Admin access required');
    }

    req.user = payload;
    return true;
  }
}
