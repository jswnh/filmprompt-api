import { z } from 'zod';

const genreTransform = z
  .union([
    z.array(z.string()),
    z.string().transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ])
  .optional()
  .default([]);

export const standardSearchSchema = z.object({
  query: z.string().trim().optional().default(''),
  genres: genreTransform,
  type: z.enum(['all', 'movie', 'tv']).optional().default('all'),
  year: z.coerce
    .number()
    .int()
    .min(1880)
    .max(2100)
    .optional(),
  minRating: z.coerce
    .number()
    .min(0)
    .max(10)
    .optional(),
  sortBy: z
    .enum([
      'popularity.desc',
      'popularity.asc',
      'vote_average.desc',
      'release_date.desc',
      'release_date.asc',
    ])
    .optional()
    .default('popularity.desc'),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  includeAdult: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
    .default(true),
});

export type StandardSearchDto = z.infer<typeof standardSearchSchema>;
