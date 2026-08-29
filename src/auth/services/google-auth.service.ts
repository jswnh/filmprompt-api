import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import authConfig from '../config/auth.config.js';

export interface GoogleUserInfo {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken?: string;
}

@Injectable()
export class GoogleAuthService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: config.ConfigType<typeof authConfig>,
  ) {}

  getAuthorizationUrl(state?: string): string {
    const clientId = this.config.googleClientId;
    const redirectUri = this.config.googleCallbackUrl;

    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'Google OAuth is not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CALLBACK_URL).',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state ? { state } : {}),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
  ): Promise<{ tokens: GoogleTokens; user: GoogleUserInfo }> {
    const clientId = this.config.googleClientId;
    const clientSecret = this.config.googleClientSecret;
    const redirectUri = this.config.googleCallbackUrl;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException(
        'Google OAuth is not configured (missing credentials or callback URL).',
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      throw new BadRequestException(
        `Failed to exchange Google authorization code: ${errBody}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
    };

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    if (!userInfoResponse.ok) {
      throw new BadRequestException('Failed to fetch Google user profile.');
    }

    const userData = (await userInfoResponse.json()) as {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    return {
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        idToken: tokenData.id_token,
      },
      user: {
        id: userData.sub,
        email: userData.email,
        emailVerified: Boolean(userData.email_verified),
        name: userData.name,
        picture: userData.picture,
      },
    };
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Invalid Google ID token.');
    }

    const data = (await response.json()) as {
      sub: string;
      email: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      aud?: string;
    };

    if (this.config.googleClientId && data.aud !== this.config.googleClientId) {
      throw new BadRequestException('Google ID token audience mismatch.');
    }

    return {
      id: data.sub,
      email: data.email,
      emailVerified:
        data.email_verified === 'true' || data.email_verified === true,
      name: data.name,
      picture: data.picture,
    };
  }
}
