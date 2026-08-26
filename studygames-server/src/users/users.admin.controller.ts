import { Controller, Get, UseGuards } from '@nestjs/common';
import { BoAuthGuard } from '../auth/bo-auth.guard';
import { UsersService } from './users.service';

@UseGuards(BoAuthGuard)
@Controller('users')
export class UsersAdminController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }
}
