import { Controller, Get, Param, Query } from '@nestjs/common';
import { LearnService } from './learn.service';
import { DictionaryService } from './dictionary.service';

@Controller('learn')
export class LearnController {
  constructor(
    private readonly learnService: LearnService,
    private readonly dictService: DictionaryService,
  ) {}

  @Get('chinese')
  getChineseCharacters(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('cursor') cursor?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : 24;
    return this.learnService.getChineseCharacters(category, level, cursor, parsedPageSize);
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

  @Get('dict/lookup/:word')
  dictLookup(@Param('word') word: string) {
    return this.dictService.lookup(word) || { error: 'Not found', word };
  }

  @Get('dict/search')
  dictSearch(@Query('q') q: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.dictService.search(q, parsedLimit);
  }
}
