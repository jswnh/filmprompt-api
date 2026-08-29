import { User, UserProfile } from '../domain/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type CreateUserInput = UserProfile & {
  passwordHash?: string | null;
};

export interface UserWithPassword {
  user: User;
  passwordHash: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findWithPasswordByEmail(email: string): Promise<UserWithPassword | null>;
  findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null>;
  findByPasswordResetTokenHash(tokenHash: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  setEmailVerificationToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void>;
  setPasswordResetToken(
    userId: string,
    tokenHash: string | null,
    expiresAt: Date | null,
  ): Promise<void>;
}
