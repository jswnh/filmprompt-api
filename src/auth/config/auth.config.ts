import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  cookieName: string;
  defaultSessionTtlHours: number;
  maxRememberMeHours: number;
  cookieDomain: string | undefined;
  cookieSecure: boolean;
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleCallbackUrl: string | null;
  bcryptSaltRounds: number;
}

export default registerAs('auth', (): AuthConfig => ({
  cookieName: process.env.AUTH_COOKIE_NAME ?? 'sid',
  // Default session duration in hours when rememberMe is omitted (e.g. 24 hours)
  defaultSessionTtlHours: Number(
    process.env.AUTH_DEFAULT_SESSION_TTL_HOURS ?? 24,
  ),
  // Maximum custom hours allowed when rememberMe is provided (e.g. 720 hours = 30 days)
  maxRememberMeHours: Number(
    process.env.AUTH_MAX_REMEMBER_ME_HOURS ?? 720,
  ),
  cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? null,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ??
    'http://localhost:3000/api/v1/auth/google/callback',
  bcryptSaltRounds: Number(process.env.AUTH_BCRYPT_SALT_ROUNDS ?? 12),
}));
