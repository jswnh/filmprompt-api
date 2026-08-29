import { User } from '../domain/user.entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserInput {
  email: string;
  passwordHash?: string | null;
  firstName: string;
  lastName: string;
}

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
