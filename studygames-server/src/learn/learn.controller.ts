import { Controller, Get, Param, Query } from '@nestjs/common';
import { LearnService } from './learn.service';

@Controller('learn')
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Get('chinese')
  getChineseCharacters(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.learnService.getChineseCharacters(category, level, parsedLimit);
  }

  @Get('chinese/categories')
  getCategories() {
    return this.learnService.getCategories();
  }

  @Get('lessons')
  getLessons(@Query('courseId') courseId?: string) {
    return this.learnService.getLessons(courseId);
  }

  @Get('chinese/:id')
  getCharacterById(@Param('id') id: string) {
    return this.learnService.getCharacterById(id);
  }
}
