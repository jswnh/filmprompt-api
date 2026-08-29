export type AuthProvider = 'credentials' | 'google';

export class Identity {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerAccountId: string;
  accessToken: string | null;
  refreshToken: string | null;
  createdAt: Date;

  constructor(partial: Partial<Identity> = {}) {
    Object.assign(this, partial);
  }
}
