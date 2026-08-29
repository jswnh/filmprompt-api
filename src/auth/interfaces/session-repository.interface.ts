import { Session } from '../domain/session.entity.js';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionRepository {
  create(
    session: Omit<Session, 'id' | 'createdAt' | 'lastUsedAt' | 'isExpired'>,
  ): Promise<Session>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  touch(sessionId: string, lastUsedAt: Date): Promise<void>;
  deleteById(sessionId: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
  deleteExpired(now: Date): Promise<void>;
}
