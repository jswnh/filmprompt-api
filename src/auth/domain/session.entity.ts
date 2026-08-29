export class Session {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ip: string | null;
  rememberMe: number | null;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;

  constructor(partial: Partial<Session> = {}) {
    Object.assign(this, partial);
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}
