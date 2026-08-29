import { Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { User } from '../domain/user.entity.js';
import { AuthProvider } from '../domain/identity.entity.js';
import { CreatedSession, SessionService } from './session.service.js';
import authConfig from '../config/auth.config.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../interfaces/user-repository.interface.js';
import {
  IDENTITY_REPOSITORY,
  type IdentityRepository,
} from '../interfaces/identity-repository.interface.js';
import { EmailService } from './email.service.js';
import { PasswordHasherService } from './password-hasher.service.js';
import { type SignUpDto } from '../dto/sign-up.dto.js';
import { type SignInDto } from '../dto/sign-in.dto.js';
import { err, ok, Result } from '../utils/result.js';
import { AuthError } from '../errors/auth-error.js';

export type SignInInput = SignInDto & {
  userAgent?: string | null;
  ip?: string | null;
};

export interface OAuthSignInInput {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  rememberMe?: number | null;
  userAgent?: string | null;
  ip?: string | null;
}

export interface SignInResult {
  user: User;
  session: CreatedSession;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: config.ConfigType<typeof authConfig>,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly emailService: EmailService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly sessionService: SessionService,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async signUp(input: SignUpDto): Promise<Result<User, AuthError>> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      return err({ code: 'EMAIL_IN_USE' });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    // Automatically generate and dispatch email verification token
    await this.sendVerificationEmail(user, input.callback);

    return ok(user);
  }

  async signIn(input: SignInInput): Promise<Result<SignInResult, AuthError>> {
    const user = await this.userRepository.findByEmail(input.email);
    // Same generic error whether the user doesn't exist or the password is wrong
    if (!user || !user.passwordHash) {
      return err({ code: 'INVALID_CREDENTIALS' });
    }

    const valid = await this.passwordHasher.verify(
      user.passwordHash,
      input.password,
    );
    if (!valid) {
      return err({ code: 'INVALID_CREDENTIALS' });
    }

    if (!user.emailVerifiedAt) {
      return err({ code: 'EMAIL_NOT_VERIFIED' });
    }

    const session = await this.sessionService.createSession({
      id: user.id,
      rememberMe: input.rememberMe,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    return ok({ user, session });
  }

  async getProfile(userId: string): Promise<Result<User, AuthError>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return err({ code: 'USER_NOT_FOUND' });
    }
    return ok(user);
  }

  async signInWithOAuth(
    input: OAuthSignInInput,
  ): Promise<Result<SignInResult, AuthError>> {
    const existingIdentity = await this.identityRepository.findByProvider(
      input.provider,
      input.providerAccountId,
    );

    let user: User | null = null;

    if (existingIdentity) {
      user = await this.userRepository.findById(existingIdentity.userId);
    }

    if (!user) {
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        user = existingUser;
        if (input.emailVerified && !user.emailVerifiedAt) {
          await this.userRepository.markEmailVerified(user.id);
          user.emailVerifiedAt = new Date();
        }
        await this.identityRepository.linkToUser(user.id, {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          accessToken: input.accessToken ?? null,
          refreshToken: input.refreshToken ?? null,
        });
      } else {
        user = await this.userRepository.create({
          email: input.email,
          passwordHash: null,
          firstName: input.firstName,
          lastName: input.lastName,
        });
        if (input.emailVerified) {
          await this.userRepository.markEmailVerified(user.id);
          user.emailVerifiedAt = new Date();
        }
        await this.identityRepository.create({
          userId: user.id,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          accessToken: input.accessToken ?? null,
          refreshToken: input.refreshToken ?? null,
        });
      }
    }

    const session = await this.sessionService.createSession({
      id: user.id,
      rememberMe: input.rememberMe,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    return ok({ user, session });
  }

  async signOut(sessionId: string): Promise<Result<void, AuthError>> {
    await this.sessionService.destroySession(sessionId);
    return ok(undefined);
  }

  async signOutAllDevices(userId: string): Promise<Result<void, AuthError>> {
    await this.sessionService.destroyAllForUser(userId);
    return ok(undefined);
  }

  async sendVerificationEmail(
    user: User,
    callback?: string,
  ): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlMs = this.config.emailVerificationTtlHours * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.userRepository.setEmailVerificationToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.emailService.sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      token: rawToken,
      callback,
    });
  }

  async resendEmailVerification(
    email: string,
    callback?: string,
  ): Promise<Result<void, AuthError>> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return ok(undefined);
    }

    if (user.emailVerifiedAt) {
      return err({ code: 'EMAIL_ALREADY_VERIFIED' });
    }

    await this.sendVerificationEmail(user, callback);
    return ok(undefined);
  }

  async verifyEmail(token: string): Promise<Result<void, AuthError>> {
    const tokenHash = this.hashToken(token);
    const user =
      await this.userRepository.findByEmailVerificationTokenHash(tokenHash);

    if (!user || !user.emailVerificationExpiresAt) {
      return err({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    if (user.emailVerificationExpiresAt.getTime() <= Date.now()) {
      await this.userRepository.setEmailVerificationToken(user.id, null, null);
      return err({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    await this.userRepository.markEmailVerified(user.id);
    return ok(undefined);
  }

  async forgotPassword(
    email: string,
    callback?: string,
  ): Promise<Result<void, AuthError>> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Prevent user enumeration
      return ok(undefined);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlMs = this.config.passwordResetTtlHours * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);

    await this.userRepository.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      token: rawToken,
      callback,
    });

    return ok(undefined);
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<Result<void, AuthError>> {
    const tokenHash = this.hashToken(token);
    const user =
      await this.userRepository.findByPasswordResetTokenHash(tokenHash);

    if (!user || !user.passwordResetExpiresAt) {
      return err({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    if (user.passwordResetExpiresAt.getTime() <= Date.now()) {
      await this.userRepository.setPasswordResetToken(user.id, null, null);
      return err({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(user.id, passwordHash);
    await this.userRepository.setPasswordResetToken(user.id, null, null);

    // Invalidate all existing sessions on password reset for security
    await this.sessionService.destroyAllForUser(user.id);

    return ok(undefined);
  }
}
