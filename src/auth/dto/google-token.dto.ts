import { z } from 'zod';

export const googleTokenSchema = z.object({
  idToken: z.string().min(1),
  rememberMe: z.number().int().positive().optional(),
});

export type GoogleTokenDto = z.infer<typeof googleTokenSchema>;
