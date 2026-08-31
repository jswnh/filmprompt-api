import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { ConfigModule } from '@nestjs/config';
import aiConfig from './config/ai.config.js';

@Module({
  imports: [ConfigModule.forFeature(aiConfig)],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
