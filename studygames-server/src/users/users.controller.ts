import { Body, Controller, Logger, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('auth')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly users: UsersService) {}

  /**
   * POST /auth/register
   * Body: { username, password }
   */
  @Post('register')
  register(@Body() body: { username?: string; password?: string }) {
    this.logger.log(`Register attempt: username=${body?.username ?? ''}`);
    return this.users.register(body?.username ?? '', body?.password ?? '');
  }

  /**
   * POST /auth/login
   * Body: { username, password }
   */
  @Post('login')
  login(@Body() body: { username?: string; password?: string }) {
    this.logger.log(`Login attempt: username=${body?.username ?? ''}`);
    return this.users.login(body?.username ?? '', body?.password ?? '');
  }
}
