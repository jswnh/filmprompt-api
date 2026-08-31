import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TmdbMediaItem, TmdbFiltersResponse, TmdbService } from '../tmdb/tmdb.service.js';
import { AiService } from '../ai/ai.service.js';
import {
  SearchDocument,
  SearchSchemaClass,
} from './schemas/search.schema.js';

export interface SearchOptions {
  query?: string;
  metadata?: {
    type?: 'all' | 'movie' | 'tv';
    genre?: string[];
  };
  type?: 'all' | 'movie' | 'tv';
  genres?: string[];
  page?: number;
  userId?: string | null;
}

export interface UnifiedSearchResponse {
  mode: 'direct' | 'ai';
  query: string;
  aiInsight?: {
    intent: string;
    reasoning: string;
    extractedGenres: string[];
    extractedYear?: number;
  } | null;
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbMediaItem[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  // Trigger words that indicate natural language intent
  private readonly naturalLanguageKeywords = [
    'best',
    'top',
    'worst',
    'like',
    'similar',
    'recommend',
    'movies about',
    'shows about',
    'series about',
    'with a',
    'set in',
    'plot twist',
    'ending',
    'vibe',
    'aesthetic',
    'mind-bending',
    'underrated',
    'scary',
    'disturbing',
    'feel-good',
    'cinematic',
    'masterpiece',
    'in 20',
    'of all time',
  ];

  constructor(
    private readonly tmdbService: TmdbService,
    private readonly aiService: AiService,
    @InjectModel(SearchSchemaClass.name)
    private readonly searchModel: Model<SearchDocument>,
  ) {}

  /**
   * 🌐 Get Search Filters (Genres, Types, Sort Options) for Frontend UI
   */
  async getFilters(): Promise<TmdbFiltersResponse> {
    return this.tmdbService.getFilters();
  }

  private isLikelyNaturalLanguage(query: string): boolean {
    const lower = query.toLowerCase().trim();
    const words = lower.split(/\s+/);

    if (words.length >= 4) return true;
    return this.naturalLanguageKeywords.some((keyword) => lower.includes(keyword));
  }

  async search(options: SearchOptions): Promise<UnifiedSearchResponse> {
    const cleanQuery = options.query?.trim() || '';
    const genreList = options.metadata?.genre || options.genres || [];
    const type = options.metadata?.type || options.type || 'all';
    const page = options.page || 1;

    let mode: 'direct' | 'ai' = 'direct';
    let aiInsight: UnifiedSearchResponse['aiInsight'] = null;
    let finalResults: TmdbMediaItem[] = [];
    let totalPages = 1;
    let totalResults = 0;

    const isNaturalQuery = cleanQuery && this.isLikelyNaturalLanguage(cleanQuery);

    // 1. Try Direct TMDB Search if not obviously a long natural language sentence
    if (!isNaturalQuery) {
      const tmdbDirect = await this.tmdbService.search({
        query: cleanQuery,
        genres: genreList,
        type,
        page,
      });

      if (tmdbDirect.results.length > 0) {
        finalResults = tmdbDirect.results;
        totalPages = tmdbDirect.totalPages;
        totalResults = tmdbDirect.totalResults;
        mode = 'direct';
      }
    }

    // 2. If direct search returned 0 results OR query is natural language, invoke AI breakdown!
    if (finalResults.length === 0 && cleanQuery) {
      this.logger.log(`Invoking AI breakdown for query: "${cleanQuery}"`);
      const aiResult = await this.aiService.parseNaturalLanguageSearch(
        cleanQuery,
        genreList,
        type,
      );

      if (aiResult && aiResult.recommendedTitles.length > 0) {
        mode = 'ai';
        aiInsight = {
          intent: aiResult.interpretedIntent,
          reasoning: aiResult.reasoning,
          extractedGenres: aiResult.extractedGenres,
          extractedYear: aiResult.extractedYear,
        };

        // Lookup each AI-recommended title on TMDB in parallel to get official posters, ratings, metadata
        const tmdbLookups = await Promise.all(
          aiResult.recommendedTitles.map((title) =>
            this.tmdbService
              .search({
                query: title,
                type,
                page: 1,
              })
              .then((res) => res.results[0] || null)
              .catch(() => null),
          ),
        );

        // Filter out nulls & deduplicate
        const seenIds = new Set<number>();
        finalResults = tmdbLookups.filter((item): item is TmdbMediaItem => {
          if (!item || seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

        totalResults = finalResults.length;
        totalPages = 1;
      }
    }

    // If still 0 results, fallback to direct TMDB discovery
    if (finalResults.length === 0) {
      const fallback = await this.tmdbService.search({
        query: cleanQuery,
        genres: genreList,
        type,
        page,
      });
      finalResults = fallback.results;
      totalPages = fallback.totalPages;
      totalResults = fallback.totalResults;
      mode = 'direct';
    }

    // 3. 💾 Store search in MongoDB history asynchronously
    this.recordSearchHistory({
      userId: options.userId,
      query: cleanQuery || (genreList.length > 0 ? `Genres: ${genreList.join(', ')}` : 'Trending'),
      genres: genreList,
      type: mode === 'ai' ? 'ai' : 'standard',
      resultsCount: finalResults.length,
    }).catch((err) => this.logger.error('Failed to save search history', err));

    return {
      mode,
      query: cleanQuery,
      aiInsight,
      page,
      totalPages,
      totalResults,
      results: finalResults,
    };
  }

  private async recordSearchHistory(data: {
    userId?: string | null;
    query: string;
    genres: string[];
    type: 'standard' | 'ai';
    resultsCount: number;
  }): Promise<void> {
    const userObjectId =
      data.userId && Types.ObjectId.isValid(data.userId)
        ? new Types.ObjectId(data.userId)
        : null;

    await this.searchModel.create({
      userId: userObjectId,
      query: data.query,
      genres: data.genres,
      type: data.type,
      resultsCount: data.resultsCount,
    });
  }
}
