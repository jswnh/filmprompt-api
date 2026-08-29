import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
