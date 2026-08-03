import { Controller, Get, Post, Body, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LandService } from './land.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'xianria-dev-secret-change-me';

@Controller('api/land')
export class LandController {
  constructor(
    private readonly landService: LandService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserFromHeader(auth?: string): { uid: string; username: string } {
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing token');
    const token = auth.slice(7);
    const payload = this.jwtService.verify(token, { secret: JWT_SECRET });
    return { uid: payload.sub, username: payload.username ?? 'Unknown' };
  }

  @Get()
  async getAllLand() {
    return this.landService.getAllLand();
  }

  @Get('mine')
  async getMyLand(@Headers('authorization') auth: string) {
    const user = this.getUserFromHeader(auth);
    return this.landService.getLandByOwner(user.uid);
  }

  @Post('buy')
  async buyLand(@Body() body: { x: number; y: number }, @Headers('authorization') auth: string) {
    const user = this.getUserFromHeader(auth);
    if (body.x === undefined || body.y === undefined) {
      throw new BadRequestException('Thiếu tọa độ x, y');
    }
    return this.landService.buyLand(user.uid, user.username, Number(body.x), Number(body.y));
  }
}
