import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service.js';
import { SearchController } from './search.controller.js';
import { TmdbModule } from '../tmdb/tmdb.module.js';
import { AiModule } from '../ai/ai.module.js';
import {
  SearchSchema,
  SearchSchemaClass,
} from './schemas/search.schema.js';

@Module({
  imports: [
    TmdbModule,
    AiModule,
    MongooseModule.forFeature([
      { name: SearchSchemaClass.name, schema: SearchSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
