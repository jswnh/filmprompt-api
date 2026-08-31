import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service.js';
import { ConfigModule } from '@nestjs/config';
import tmdbConfig from './config/tmdb.config.js';

@Module({
  imports: [ConfigModule.forFeature(tmdbConfig)],
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
