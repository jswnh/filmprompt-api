import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as config from '@nestjs/config';
import tmdbConfig from './config/tmdb.config.js';

export interface TmdbMediaItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  genres: string[];
}

export interface TmdbSearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbMediaItem[];
}

export interface TmdbSearchOptions {
  query?: string;
  genres?: string[];
  type?: 'all' | 'movie' | 'tv';
  includeAdult?: boolean;
  page?: number;
}

export interface TmdbFiltersResponse {
  types: Array<{ id: 'all' | 'movie' | 'tv'; label: string }>;
  movieGenres: Array<{ id: number; name: string }>;
  tvGenres: Array<{ id: number; name: string }>;
  allGenres: string[];
  sortOptions: Array<{ id: string; label: string }>;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private genreMap = new Map<number, string>();
  private genreNameToIdMap = new Map<string, number>();
  private cachedMovieGenres: Array<{ id: number; name: string }> = [];
  private cachedTvGenres: Array<{ id: number; name: string }> = [];
  private genresLoaded = false;

  constructor(
    @Inject(tmdbConfig.KEY)
    private readonly config: config.ConfigType<typeof tmdbConfig>,
  ) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    return headers;
  }

  private buildUrl(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ): string {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const url = new URL(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
    );

    if (!this.config.accessToken && this.config.apiKey) {
      url.searchParams.set('api_key', this.config.apiKey);
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  async loadGenres(): Promise<void> {
    if (this.genresLoaded) return;

    try {
      const [movieRes, tvRes] = await Promise.all([
        fetch(this.buildUrl('/genre/movie/list'), { headers: this.getHeaders() }),
        fetch(this.buildUrl('/genre/tv/list'), { headers: this.getHeaders() }),
      ]);

      if (movieRes.ok) {
        const movieData = (await movieRes.json()) as {
          genres: Array<{ id: number; name: string }>;
        };
        this.cachedMovieGenres = movieData.genres || [];
        for (const g of this.cachedMovieGenres) {
          this.genreMap.set(g.id, g.name);
          this.genreNameToIdMap.set(g.name.toLowerCase().trim(), g.id);
        }
      }

      if (tvRes.ok) {
        const tvData = (await tvRes.json()) as {
          genres: Array<{ id: number; name: string }>;
        };
        this.cachedTvGenres = tvData.genres || [];
        for (const g of this.cachedTvGenres) {
          this.genreMap.set(g.id, g.name);
          this.genreNameToIdMap.set(g.name.toLowerCase().trim(), g.id);
        }
      }

      this.genresLoaded = true;
    } catch (err) {
      this.logger.error('Error loading TMDB genres', err);
    }
  }

  async getFilters(): Promise<TmdbFiltersResponse> {
    await this.loadGenres();

    const allGenreNames = Array.from(
      new Set([
        ...this.cachedMovieGenres.map((g) => g.name),
        ...this.cachedTvGenres.map((g) => g.name),
      ]),
    ).sort((a, b) => a.localeCompare(b));

    return {
      types: [
        { id: 'all', label: 'All (Movies & TV)' },
        { id: 'movie', label: 'Movies' },
        { id: 'tv', label: 'TV Series' },
      ],
      movieGenres: this.cachedMovieGenres,
      tvGenres: this.cachedTvGenres,
      allGenres: allGenreNames,
      sortOptions: [
        { id: 'popularity.desc', label: 'Most Popular' },
        { id: 'vote_average.desc', label: 'Highest Rated' },
        { id: 'release_date.desc', label: 'Release Date (Newest)' },
        { id: 'release_date.asc', label: 'Release Date (Oldest)' },
      ],
    };
  }

  private mapGenreNames(genreIds: number[]): string[] {
    return (genreIds || []).map((id) => this.genreMap.get(id) || `Genre_${id}`);
  }

  private resolveGenreIds(genres: string[]): number[] {
    const ids = new Set<number>();

    for (const g of genres) {
      const normalized = g.toLowerCase().trim();
      if (/^\d+$/.test(normalized)) {
        ids.add(parseInt(normalized, 10));
        continue;
      }

      for (const [id, name] of this.genreMap.entries()) {
        const lowerName = name.toLowerCase();
        if (
          lowerName === normalized ||
          lowerName.split(/[\s,&]+/).includes(normalized) ||
          (normalized === 'action' && lowerName.includes('action')) ||
          (normalized === 'adventure' && lowerName.includes('adventure')) ||
          (normalized.includes('sci') && lowerName.includes('sci')) ||
          (normalized === 'fantasy' && lowerName.includes('fantasy')) ||
          (normalized === 'war' && lowerName.includes('war'))
        ) {
          ids.add(id);
        }
      }
    }

    return Array.from(ids);
  }

  private formatItem(raw: any, explicitType?: 'movie' | 'tv'): TmdbMediaItem | null {
    const mediaType: 'movie' | 'tv' =
      explicitType || (raw.media_type === 'tv' ? 'tv' : 'movie');

    if (raw.media_type === 'person') {
      return null;
    }

    const imageBase = this.config.imageBaseUrl.replace(/\/+$/, '');
    return {
      id: raw.id,
      mediaType,
      title: raw.title || raw.name || '',
      originalTitle: raw.original_title || raw.original_name || '',
      overview: raw.overview || '',
      posterPath: raw.poster_path || null,
      posterUrl: raw.poster_path ? `${imageBase}/w500${raw.poster_path}` : null,
      backdropPath: raw.backdrop_path || null,
      backdropUrl: raw.backdrop_path
        ? `${imageBase}/original${raw.backdrop_path}`
        : null,
      releaseDate: raw.release_date || raw.first_air_date || null,
      voteAverage: Number((raw.vote_average || 0).toFixed(1)),
      voteCount: raw.vote_count || 0,
      popularity: raw.popularity || 0,
      genreIds: raw.genre_ids || [],
      genres: this.mapGenreNames(raw.genre_ids || []),
    };
  }

  async search(options: TmdbSearchOptions = {}): Promise<TmdbSearchResponse> {
    await this.loadGenres();

    const cleanQuery = options.query?.trim() || '';
    const genres = options.genres || [];
    const type = options.type || 'all';
    const page = options.page || 1;
    const includeAdult = options.includeAdult ?? true; // 🔞 Default to allow adult & all age ratings
    const genreIds = this.resolveGenreIds(genres);

    let url: string;
    let explicitType: 'movie' | 'tv' | undefined = undefined;

    if (cleanQuery) {
      if (type === 'movie') {
        url = this.buildUrl('/search/movie', {
          query: cleanQuery,
          page,
          include_adult: includeAdult,
        });
        explicitType = 'movie';
      } else if (type === 'tv') {
        url = this.buildUrl('/search/tv', {
          query: cleanQuery,
          page,
          include_adult: includeAdult,
        });
        explicitType = 'tv';
      } else {
        url = this.buildUrl('/search/multi', {
          query: cleanQuery,
          page,
          include_adult: includeAdult,
        });
      }
    } else if (genreIds.length > 0) {
      if (type === 'tv') {
        url = this.buildUrl('/discover/tv', {
          with_genres: genreIds.join(','),
          page,
          sort_by: 'popularity.desc',
          include_adult: includeAdult,
        });
        explicitType = 'tv';
      } else {
        url = this.buildUrl('/discover/movie', {
          with_genres: genreIds.join(','),
          page,
          sort_by: 'popularity.desc',
          include_adult: includeAdult,
        });
        explicitType = 'movie';
      }
    } else {
      if (type === 'tv') {
        url = this.buildUrl('/trending/tv/day', { page });
        explicitType = 'tv';
      } else if (type === 'movie') {
        url = this.buildUrl('/trending/movie/day', { page });
        explicitType = 'movie';
      } else {
        url = this.buildUrl('/trending/all/day', { page });
      }
    }

    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`TMDB search error: ${response.status} - ${errorText}`);
      throw new BadRequestException(`TMDB API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      page: number;
      total_pages: number;
      total_results: number;
      results: any[];
    };

    let formattedItems = (data.results || [])
      .map((item) => this.formatItem(item, explicitType))
      .filter((item): item is TmdbMediaItem => item !== null);

    if (genreIds.length > 0) {
      formattedItems = formattedItems.filter((item) =>
        genreIds.some((gId) => item.genreIds.includes(gId)),
      );
    }

    return {
      page: data.page || page,
      totalPages: data.total_pages || 1,
      totalResults:
        genreIds.length > 0 ? formattedItems.length : data.total_results,
      results: formattedItems,
    };
  }
}
