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
  emailVerificationTtlHours: number;
  passwordResetTtlHours: number;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpSecure: boolean;
  emailFrom: string;
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
  emailVerificationTtlHours: Number(
    process.env.AUTH_EMAIL_VERIFICATION_TTL_HOURS ?? 24,
  ),
  passwordResetTtlHours: Number(
    process.env.AUTH_PASSWORD_RESET_TTL_HOURS ?? 1,
  ),
  smtpHost: process.env.SMTP_HOST ?? null,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? null,
  smtpPass: process.env.SMTP_PASS ?? null,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  emailFrom: process.env.EMAIL_FROM ?? 'noreply@filmprompt.com',
  bcryptSaltRounds: Number(process.env.AUTH_BCRYPT_SALT_ROUNDS ?? 12),
}));
