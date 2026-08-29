import { z } from 'zod';

export const resendVerificationSchema = z.object({
  email: z.email(),
  callback: z.url().optional(),
});

export type ResendVerificationDto = z.infer<typeof resendVerificationSchema>;
