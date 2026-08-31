import { Inject, Injectable, Logger } from '@nestjs/common';
import * as config from '@nestjs/config';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';
import aiConfig from './config/ai.config.js';

export interface AiNaturalLanguageResult {
  interpretedIntent: string;
  recommendedTitles: string[];
  reasoning: string;
  extractedGenres: string[];
  extractedYear?: number;
}

const naturalLanguageSearchSchema = z.object({
  interpretedIntent: z
    .string()
    .describe('Clear summary of what the user is looking for'),
  recommendedTitles: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe('List of 5-8 exact movie or TV series titles that best match the query'),
  reasoning: z
    .string()
    .describe('Brief explanation of why these recommendations were selected'),
  extractedGenres: z
    .array(z.string())
    .describe('Any genres identified in the request (e.g. Action, Sci-Fi, Mystery)'),
  extractedYear: z
    .number()
    .optional()
    .describe('Any specific release year or decade identified (e.g. 2026, 1999)'),
});

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openrouter: ReturnType<typeof createOpenRouter>;

  constructor(
    @Inject(aiConfig.KEY)
    private readonly config: config.ConfigType<typeof aiConfig>,
  ) {
    this.openrouter = createOpenRouter({
      apiKey: this.config.openrouterApiKey,
    });
  }

  async parseNaturalLanguageSearch(
    query: string,
    genres: string[] = [],
    type: 'all' | 'movie' | 'tv' = 'all',
  ): Promise<AiNaturalLanguageResult | null> {
    try {
      const modelName =
        this.config.defaultModel || 'google/gemini-2.0-flash-001';
      const model = this.openrouter(modelName);

      const typeConstraint =
        type === 'tv'
          ? 'Focus specifically on TV Series and shows.'
          : type === 'movie'
            ? 'Focus specifically on feature Films and movies.'
            : 'You may recommend both Movies and TV Series.';

      const genreConstraint =
        genres.length > 0
          ? `The user specifically prefers these genres: ${genres.join(', ')}.`
          : '';

      const { object } = await generateObject({
        model,
        schema: naturalLanguageSearchSchema,
        prompt: `You are an expert cinematic movie and TV curator.
The user entered this natural language search: "${query}".

${typeConstraint}
${genreConstraint}

Break down the user's intent, themes, visual mood, or criteria (e.g. "best of a year", "movies like X", "plot twists", "rainy aesthetic").
Recommend 5 to 8 well-known, high-quality, real movie/TV titles that perfectly fit this description. Use exact, standard English release titles for accurate TMDB lookups.`,
      });

      return object;
    } catch (error) {
      this.logger.error('Error during AI natural language parsing:', error);
      return null;
    }
  }
}
