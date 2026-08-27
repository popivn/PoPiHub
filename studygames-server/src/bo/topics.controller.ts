import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

/**
 * Public topics controller — GET /api/topics không yêu cầu auth.
 * Dùng cho FE client (LandingPage) để hiển thị "BẠN MUỐN HỌC GÌ?".
 */
@Controller('topics')
export class TopicsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  findAll() {
    return this.settings.getTopics();
  }
}
