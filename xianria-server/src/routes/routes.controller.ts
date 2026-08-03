import { Controller, Get } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('api')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('routes')
  getAll() {
    return this.routesService.toMap();
  }
}
