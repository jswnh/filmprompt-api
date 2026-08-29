import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email(),
  callback: z.url().optional(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
