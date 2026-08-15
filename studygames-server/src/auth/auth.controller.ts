import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * POST /auth/anonymous
   * Body (optional): { uid?: string }  — gửi lại uid cũ để reuse session
   *
   * Response: { accessToken, uid, isNewUser }
   */
  @Post('anonymous')
  async anonymous(@Body() body: { uid?: string }) {
    return this.auth.anonymousSignIn(body?.uid);
  }

  /**
   * GET /auth/me  — yêu cầu JWT, trả uid hiện tại
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { uid: req.user.sub, provider: req.user.provider };
  }
}
