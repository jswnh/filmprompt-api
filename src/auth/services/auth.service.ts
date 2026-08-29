import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import { AuthProvider } from '../domain/identity.entity.js';
import { CreatedSession, SessionService } from './session.service.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../interfaces/user-repository.interface.js';
import {
  IDENTITY_REPOSITORY,
  type IdentityRepository,
} from '../interfaces/identity-repository.interface.js';
import { PasswordHasherService } from './password-hasher.service.js';
import { err, ok, Result } from '../utils/result.js';
import { AuthError } from '../errors/auth-error.js';

export interface SignUpInput {
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: number | null;
  userAgent?: string | null;
  ip?: string | null;
}

export interface OAuthSignInInput {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
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
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly sessionService: SessionService,
  ) {}

  async signUp(input: SignUpInput): Promise<Result<User, AuthError>> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      return err({ code: 'EMAIL_IN_USE' });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
    });

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

    const session = await this.sessionService.createSession({
      id: user.id,
      rememberMe: input.rememberMe,
      userAgent: input.userAgent,
      ip: input.ip,
    });

    return ok({ user, session });
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
}
