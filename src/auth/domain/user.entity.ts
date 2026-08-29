import { z } from 'zod';

// ============================================================================
// 🌟 MASTER USER PROFILE SCHEMA (SINGLE SOURCE OF TRUTH)
// Add or remove your custom user fields right here!
// Adding a field here will cause TypeScript to highlight in red all locations
// that require mapping (Mapper, Mongo Repository, etc.)
// ============================================================================
export const userProfileSchema = z.object({
  email: z.string().email(),
  // 👇 Add your custom user fields below (e.g. name, avatarUrl, role):
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
