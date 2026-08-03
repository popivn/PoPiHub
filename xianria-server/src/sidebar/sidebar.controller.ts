import { Controller, Get } from '@nestjs/common';
import { SidebarService } from './sidebar.service';

@Controller('api')
export class SidebarController {
  constructor(private readonly sidebarService: SidebarService) {}

  @Get('sidebar')
  getAll() {
    return this.sidebarService.getAll();
  }
}
