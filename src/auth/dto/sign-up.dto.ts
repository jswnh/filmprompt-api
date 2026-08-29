import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  callback: z.string().url().optional(),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
