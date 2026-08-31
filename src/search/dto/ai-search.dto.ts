import { z } from 'zod';

export const aiSearchSchema = z.object({
  prompt: z.string().min(3).max(1000).trim(),
  genres: z.array(z.string()).optional().default([]),
  limit: z.number().int().min(1).max(20).default(5),
});

export type AiSearchDto = z.infer<typeof aiSearchSchema>;
