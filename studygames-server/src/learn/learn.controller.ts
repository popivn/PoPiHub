import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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

  @Get('dict/phrasesearch')
  dictPhraseSearch(@Query('q') q: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.dictService.phraseSearch(q, parsedLimit);
  }

  @Get('dict/hanzi/:char')
  async dictHanziDetails(@Param('char') char: string) {
    const details = await this.dictService.getHanziDetails(char);
    return details || { error: 'Character not found', char };
  }

  @Get('dict/hanzi/:char/etymology-vi')
  dictHanziEtymologyVi(@Param('char') char: string) {
    const result = this.dictService.getHanziEtymologyVi(char);
    return result || { error: 'No etymology available', char };
  }

  @Get('dict/examples/:word')
  dictExamples(@Param('word') word: string) {
    console.log(`\n[BE LOG] 📥 [GET /learn/dict/examples/${word}] -> Client is requesting example sentences`);
    const examples = this.dictService.getExamples(word);
    console.log(`[BE LOG] 📤 [GET /learn/dict/examples/${word}] -> Returning ${examples.length} example sentences`);
    return examples;
  }

  @Post('dict/translate-examples')
  async translateExamples(@Body() body: { sentences: string[] }) {
    const sentences = Array.isArray(body?.sentences) ? body.sentences : [];
    console.log(`\n[BE LOG] 📥 [POST /learn/dict/translate-examples] -> Requesting AI translation for ${sentences.length} sentences`);
    const translations = await this.dictService.translateSentences(sentences);
    console.log(`[BE LOG] 📤 [POST /learn/dict/translate-examples] -> Returning translations for ${Object.keys(translations).length} sentences`);
    return translations;
  }

  @Get('vocabulary/topics')
  getVocabularyTopics() {
    console.log('\n[BE LOG] 📥 [GET /learn/vocabulary/topics] -> Client is requesting vocabulary topics');
    const topics = this.learnService.getCategories();
    console.log(`[BE LOG] 📤 [GET /learn/vocabulary/topics] -> Returning ${topics.length} topics to client`);
    return topics;
  }

  @Get('vocabulary/topics/:topicId')
  async getVocabularyByTopic(
    @Param('topicId') topicId: string,
    @Query('cursor') cursor?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : 24;
    console.log(`\n[BE LOG] 📥 [GET /learn/vocabulary/topics/${topicId}] -> Client is requesting words for topic: ${topicId}`);
    const result = await this.learnService.getChineseCharacters(topicId, undefined, cursor, parsedPageSize);
    console.log(`[BE LOG] 📤 [GET /learn/vocabulary/topics/${topicId}] -> Returning ${result.items.length} words (hasMore: ${result.hasMore})`);
    return result;
  }
}
