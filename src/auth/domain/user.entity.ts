import { z } from 'zod';

export const userProfileSchema = z.object({
  email: z.email(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export interface UserSystemFields {
  id: string;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserResponse = UserProfile & {
  id: string;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  [key: string]: unknown;

  constructor(data: UserProfile & UserSystemFields) {
    Object.assign(this, data);
  }

  toResponse(): UserResponse {
    const {
      id,
      emailVerifiedAt,
      emailVerificationTokenHash,
      emailVerificationExpiresAt,
      passwordResetTokenHash,
      passwordResetExpiresAt,
      createdAt,
      updatedAt,
      ...profile
    } = this;

    return {
      id: this.id,
      ...(profile as UserProfile),
      emailVerified: Boolean(this.emailVerifiedAt),
      emailVerifiedAt: this.emailVerifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
