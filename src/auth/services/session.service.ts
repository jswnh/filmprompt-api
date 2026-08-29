import { Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { Session } from '../domain/session.entity.js';
import authConfig from '../config/auth.config.js';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../interfaces/session-repository.interface.js';

export interface CreateSessionInput {
  id: string;
  rememberMe?: number | null;
  userAgent?: string | null;
  ip?: string | null;
}

export interface CreatedSession {
  session: Session;
  rawToken: string;
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  domain: string | undefined;
  path: '/';
  maxAge: number | undefined;
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: config.ConfigType<typeof authConfig>,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  private hashToken(rawToken: string): string {
    // Only the hash is ever persisted — a DB leak alone can't produce a valid session token
    return createHash('sha256').update(rawToken).digest('hex');
  }

  async createSession(input: CreateSessionInput): Promise<CreatedSession> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const hours =
      input.rememberMe !== undefined &&
      input.rememberMe !== null &&
      input.rememberMe > 0
        ? Math.min(input.rememberMe, this.config.maxRememberMeHours)
        : this.config.defaultSessionTtlHours;
    const ttlMs = hours * 60 * 60 * 1000;
    const now = new Date();

    const session = await this.sessionRepository.create({
      userId: input.id,
      tokenHash,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      rememberMe: input.rememberMe ?? null,
      expiresAt: new Date(now.getTime() + ttlMs),
    });

    return { session, rawToken };
  }

  async validateToken(rawToken: string): Promise<Session | null> {
    const tokenHash = this.hashToken(rawToken);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);
    if (!session) return null;

    if (session.isExpired()) {
      await this.sessionRepository.deleteById(session.id);
      return null;
    }

    await this.sessionRepository.touch(session.id, new Date());
    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.sessionRepository.deleteById(sessionId);
  }

  async destroyAllForUser(userId: string): Promise<void> {
    await this.sessionRepository.deleteAllForUser(userId);
  }

  getCookieOptions(expiresAt: Date): SessionCookieOptions {
    const now = new Date();
    const maxAge = Math.max(0, expiresAt.getTime() - now.getTime());
    return {
      httpOnly: true,
      secure: this.config.cookieSecure,
      sameSite: 'lax',
      domain: this.config.cookieDomain,
      path: '/',
      maxAge,
    };
  }

  get cookieName(): string {
    return this.config.cookieName;
  }
}
