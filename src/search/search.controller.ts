import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SearchService } from './search.service.js';
import { CurrentUser, SessionGuard, User } from '../auth/index.js';

export interface SearchRequestBody {
  query?: string;
  metadata?: {
    type?: 'all' | 'movie' | 'tv';
    genre?: string[];
  };
  type?: 'all' | 'movie' | 'tv';
  genres?: string[];
  page?: number;
}

@Controller('search')
@UseGuards(ThrottlerGuard) // Enforce global rate limiting for all endpoints
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 🌐 PUBLIC & RATE-LIMITED: GET /api/v1/search/filters
   * Returns list of media types, movie genres, TV genres, all unified genre pills, and sort filters.
   * Rate limited: 60 requests per minute. No login required.
   */
  @Get('filters')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getFilters() {
    const filters = await this.searchService.getFilters();
    return {
      ok: true as const,
      data: filters,
    };
  }

  /**
   * 🔒 AUTHENTICATED: GET /api/v1/search?query=Reacher&type=tv&genres=Action&page=1
   * Protected: Requires active user session.
   * Rate limited: 30 requests per minute.
   */
  @Get()
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async searchGet(
    @CurrentUser() user: User,
    @Query('query') query?: string,
    @Query('type') typeParam?: 'all' | 'movie' | 'tv',
    @Query('genres') genresParam?: string | string[],
    @Query('genre') genreParam?: string | string[],
    @Query('page') pageParam?: string,
  ) {
    const rawGenres = genresParam || genreParam || [];
    const genres = Array.isArray(rawGenres)
      ? rawGenres
      : rawGenres.split(',').map((g) => g.trim()).filter(Boolean);

    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const result = await this.searchService.search({
      query,
      metadata: {
        type: typeParam || 'all',
        genre: genres,
      },
      page: isNaN(page) ? 1 : page,
      userId: user.id,
    });

    return {
      ok: true as const,
      data: result,
    };
  }

  /**
   * 🔒 AUTHENTICATED: POST /api/v1/search
   * Protected: Requires active user session.
   * Rate limited: 20 requests per minute.
   */
  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async searchPost(
    @CurrentUser() user: User,
    @Body() body: SearchRequestBody,
  ) {
    const type = body.metadata?.type || body.type || 'all';
    const genres = body.metadata?.genre || body.genres || [];

    const result = await this.searchService.search({
      query: body.query,
      metadata: {
        type,
        genre: genres,
      },
      page: body.page,
      userId: user.id,
    });

    return {
      ok: true as const,
      data: result,
    };
  }
}
