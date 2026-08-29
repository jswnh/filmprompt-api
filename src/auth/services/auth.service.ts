import { Inject, Injectable } from '@nestjs/common';
import { User } from '../domain/user.entity.js';
import { CreatedSession, SessionService } from './session.service.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../interfaces/user-repository.interface.js';
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
  rememberMe: boolean;
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

  async signOut(sessionId: string): Promise<Result<void, AuthError>> {
    await this.sessionService.destroySession(sessionId);
    return ok(undefined);
  }

  async signOutAllDevices(userId: string): Promise<Result<void, AuthError>> {
    await this.sessionService.destroyAllForUser(userId);
    return ok(undefined);
  }
}
