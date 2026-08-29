import { z } from 'zod';
import { userProfileSchema } from '../domain/user.entity.js';

export const signUpSchema = userProfileSchema.extend({
  password: z.string().min(8).max(128),
  callback: z.url().optional(),
});

export type SignUpDto = z.infer<typeof signUpSchema>;
