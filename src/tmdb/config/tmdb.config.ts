import { registerAs } from '@nestjs/config';

export default registerAs('tmdb', () => ({
  apiKey: process.env.TMDB_API_KEY!,
  accessToken: process.env.TMDB_ACCESS_TOKEN!,
  baseUrl: process.env.TMDB_BASE_URL!,
  imageBaseUrl: 'https://image.tmdb.org/t/p',
}));
