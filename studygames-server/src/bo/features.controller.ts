import { Controller, Get } from '@nestjs/common';
import { FeaturesService } from './features.service';

/**
 * Public features controller — GET /api/features không yêu cầu auth.
 * Dùng cho FE client (LandingPage section Tính Năng).
 */
@Controller('features')
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}

  @Get()
  findAll() {
    return this.features.getFeatures();
  }
}
