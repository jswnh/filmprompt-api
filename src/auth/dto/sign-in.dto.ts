import { z } from 'zod';

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export type SignInDto = z.infer<typeof signInSchema>;
