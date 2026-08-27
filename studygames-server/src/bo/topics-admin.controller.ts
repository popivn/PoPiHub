import { Body, Controller, Delete, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BoAuthGuard } from '../auth/bo-auth.guard';
import { SettingsService, TopicItem } from './settings.service';

/**
 * Admin topics controller — write operations (POST/PATCH/DELETE) yêu cầu admin JWT.
 * Route cùng /api/topics nhưng guard chỉ áp cho write.
 */
@UseGuards(BoAuthGuard)
@Controller('topics')
export class TopicsAdminController {
  constructor(private readonly settings: SettingsService) {}

  @Post()
  async create(@Body() body: Partial<TopicItem>) {
    const topics = await this.settings.getTopics();
    const topic: TopicItem = {
      id: `topic_${Date.now()}`,
      name: body.name ?? 'Chủ đề mới',
      nameEn: body.nameEn,
      active: body.active ?? true,
      courses: body.courses ?? [],
    };
    topics.push(topic);
    await this.settings.updateTopics(topics);
    return topic;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<TopicItem>) {
    const topics = await this.settings.getTopics();
    const idx = topics.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new NotFoundException('Topic not found');
    }
    topics[idx] = { ...topics[idx], ...body };
    await this.settings.updateTopics(topics);
    return topics[idx];
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const topics = await this.settings.getTopics();
    const filtered = topics.filter((t) => t.id !== id);
    await this.settings.updateTopics(filtered);
    return { id };
  }
}
