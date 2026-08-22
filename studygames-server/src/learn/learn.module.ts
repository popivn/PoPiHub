import { Module } from '@nestjs/common';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { DictionaryService } from './dictionary.service';

@Module({
  controllers: [LearnController],
  providers: [LearnService, DictionaryService],
  exports: [LearnService, DictionaryService],
})
export class LearnModule {}
