import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  cookieName: string;
  sessionTtlMs: number;
  rememberMeTtlMs: number;
  cookieDomain: string | undefined;
  cookieSecure: boolean;
  googleClientId: string | null;
  googleClientSecret: string | null;
  bcryptSaltRounds: number;
}

export default registerAs('auth', (): AuthConfig => ({
  cookieName: process.env.AUTH_COOKIE_NAME ?? 'sid',
  // 2 hours default for a normal session
  sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS ?? 1000 * 60 * 60 * 2),
  // 30 days default when "remember me" is checked
  rememberMeTtlMs: Number(
    process.env.AUTH_REMEMBER_ME_TTL_MS ?? 1000 * 60 * 60 * 24 * 30,
  ),
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
  // Intentionally null for now — wired up when Google OAuth is added later
  googleClientSecret: null,
  bcryptSaltRounds: Number(process.env.AUTH_BCRYPT_SALT_ROUNDS ?? 12),
}));
