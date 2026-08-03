import { Controller, Get, Post, Body } from '@nestjs/common';
import { BannerService } from './banner.service';

@Controller('api/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getAll() {
    return this.bannerService.getAll();
  }

  @Get('latest')
  async getLatest() {
    const banner = await this.bannerService.getLatest();
    return banner ?? { url: null };
  }

  @Post('upload')
  async upload(@Body() body: { title: string; base64: string; mimeType: string }) {
    const base64Data = body.base64.replace(/^data:[^;]+;base64,/, '');
    return this.bannerService.upload(body.title, base64Data, body.mimeType || 'image/png');
  }
}
