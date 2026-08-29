import { Body, Controller, Delete, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BoAuthGuard } from '../auth/bo-auth.guard';
import { FeaturesService, FeatureItem } from './features.service';

/**
 * Admin features controller — write operations (POST/PATCH/DELETE) yêu cầu admin JWT.
 */
@UseGuards(BoAuthGuard)
@Controller('features')
export class FeaturesAdminController {
  constructor(private readonly features: FeaturesService) {}

  @Post()
  async create(@Body() body: Partial<FeatureItem>) {
    return this.features.createFeature(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<FeatureItem>) {
    try {
      return await this.features.updateFeature(id, body);
    } catch {
      throw new NotFoundException('Feature not found');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.features.removeFeature(id);
  }
}
