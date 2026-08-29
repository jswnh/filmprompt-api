import { z } from 'zod';

export const userProfileSchema = z.object({
  // --------------------------------------------------------------------------
  // 🔒 ORIGIN FIELD (DO NOT REMOVE)
  // Required core authentication identity identifier:
  // --------------------------------------------------------------------------
  email: z.email(),

  // --------------------------------------------------------------------------
  // ➕ CUSTOMIZABLE FIELDS (ADD / REMOVE YOUR FIELDS HERE)
  // You can safely add, edit, or remove custom user profile fields below:
  // Examples:
  // name: z.string().min(1),
  // avatarUrl: z.url().nullable().optional(),
  // role: z.enum(['USER', 'ADMIN']).default('USER'),
  // bio: z.string().max(500).optional(),
  // --------------------------------------------------------------------------
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ============================================================================
// 🔒 ORIGIN SYSTEM FIELDS (DO NOT REMOVE OR RENAME)
// These fields are managed automatically by authentication, session, and DB:
// ============================================================================
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
  // 🔒 Core identity:
  id: string;
  email: string;

  // 🔒 Core security & verification timestamps/tokens:
  emailVerifiedAt: Date | null;
  emailVerificationTokenHash: string | null;
  emailVerificationExpiresAt: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // ➕ Dynamic custom profile fields:
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
