import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { GoogleAuthService } from '../services/google-auth.service.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { type SignUpDto, signUpSchema } from '../dto/sign-up.dto.js';
import { type SignInDto, signInSchema } from '../dto/sign-in.dto.js';
import {
  type GoogleTokenDto,
  googleTokenSchema,
} from '../dto/google-token.dto.js';
import {
  type VerifyEmailDto,
  verifyEmailSchema,
} from '../dto/verify-email.dto.js';
import {
  type ResendVerificationDto,
  resendVerificationSchema,
} from '../dto/resend-verification.dto.js';
import {
  type ForgotPasswordDto,
  forgotPasswordSchema,
} from '../dto/forgot-password.dto.js';
import {
  type ResetPasswordDto,
  resetPasswordSchema,
} from '../dto/reset-password.dto.js';
import {
  SessionGuard,
  type RequestWithSession,
} from '../guards/session.guard.js';
import { CurrentUserId } from '../decorators/current-user-id.decorator.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { CurrentSession } from '../decorators/current-session.decorator.js';
import { User } from '../domain/user.entity.js';
import { Session } from '../domain/session.entity.js';
import { AuthError } from '../errors/auth-error.js';

function mapAuthErrorToHttpException(error: AuthError): HttpException {
  switch (error.code) {
    case 'EMAIL_IN_USE':
      return new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        error: error.code,
        message: 'An account with this email already exists.',
      });
    case 'INVALID_CREDENTIALS':
      return new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: error.code,
        message: 'Invalid email or password.',
      });
    case 'USER_NOT_FOUND':
      return new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: error.code,
        message: 'User not found.',
      });
    case 'EMAIL_NOT_VERIFIED':
      return new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        error: error.code,
        message: 'Please verify your email address before signing in.',
      });
    case 'INVALID_OR_EXPIRED_TOKEN':
      return new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.code,
        message: 'The token is invalid or has expired.',
      });
    case 'EMAIL_ALREADY_VERIFIED':
      return new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.code,
        message: 'This email is already verified.',
      });
    default:
      return new InternalServerErrorException();
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('sign-up')
  @UsePipes(new ZodValidationPipe(signUpSchema))
  async signUp(@Body() body: SignUpDto) {
    const result = await this.authService.signUp(body);
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    return {
      ok: true as const,
      user: {
        id: result.value.id,
        email: result.value.email,
        firstName: result.value.firstName,
        lastName: result.value.lastName,
        emailVerified: Boolean(result.value.emailVerifiedAt),
        emailVerifiedAt: result.value.emailVerifiedAt,
      },
    };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(signInSchema))
  async signIn(
    @Body() body: SignInDto,
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }

    const { session, rawToken } = result.value.session;
    res.cookie(
      this.sessionService.cookieName,
      rawToken,
      this.sessionService.getCookieOptions(session.expiresAt),
    );

    return {
      ok: true as const,
      user: {
        id: result.value.user.id,
        email: result.value.user.email,
        firstName: result.value.user.firstName,
        lastName: result.value.user.lastName,
        emailVerified: Boolean(result.value.user.emailVerifiedAt),
        emailVerifiedAt: result.value.user.emailVerifiedAt,
      },
    };
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async signOut(
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.session) {
      const result = await this.authService.signOut(req.session.id);
      if (!result.ok) {
        throw mapAuthErrorToHttpException(result.error);
      }
    }
    res.clearCookie(this.sessionService.cookieName);
    return { ok: true as const };
  }

  @Post('sign-out-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async signOutAll(
    @CurrentUserId() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signOutAllDevices(userId);
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    res.clearCookie(this.sessionService.cookieName);
    return { ok: true as const };
  }

  @Get('session')
  @UseGuards(SessionGuard)
  getSession(
    @CurrentUser() user: User,
    @CurrentSession() session: Session,
  ) {
    return {
      ok: true as const,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: Boolean(user.emailVerifiedAt),
        emailVerifiedAt: user.emailVerifiedAt,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        rememberMe: session.rememberMe,
        userAgent: session.userAgent,
        ip: session.ip,
      },
    };
  }

  @Get('google')
  googleAuth(@Res() res: Response, @Query('state') state?: string) {
    const url = this.googleAuthService.getAuthorizationUrl(state);
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string | undefined,
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }
    if (!code) {
      throw new BadRequestException('Authorization code is missing.');
    }

    const { tokens, user } =
      await this.googleAuthService.exchangeCodeForTokens(code);

    const result = await this.authService.signInWithOAuth({
      provider: 'google',
      providerAccountId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }

    const { session, rawToken } = result.value.session;
    res.cookie(
      this.sessionService.cookieName,
      rawToken,
      this.sessionService.getCookieOptions(session.expiresAt),
    );

    return {
      ok: true as const,
      user: {
        id: result.value.user.id,
        email: result.value.user.email,
        firstName: result.value.user.firstName,
        lastName: result.value.user.lastName,
        emailVerified: Boolean(result.value.user.emailVerifiedAt),
        emailVerifiedAt: result.value.user.emailVerifiedAt,
      },
    };
  }

  @Post('google/token')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(googleTokenSchema))
  async googleTokenSignIn(
    @Body() body: GoogleTokenDto,
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    const googleUser = await this.googleAuthService.verifyIdToken(body.idToken);

    const result = await this.authService.signInWithOAuth({
      provider: 'google',
      providerAccountId: googleUser.id,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      emailVerified: googleUser.emailVerified,
      rememberMe: body.rememberMe,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }

    const { session, rawToken } = result.value.session;
    res.cookie(
      this.sessionService.cookieName,
      rawToken,
      this.sessionService.getCookieOptions(session.expiresAt),
    );

    return {
      ok: true as const,
      user: {
        id: result.value.user.id,
        email: result.value.user.email,
        firstName: result.value.user.firstName,
        lastName: result.value.user.lastName,
        emailVerified: Boolean(result.value.user.emailVerifiedAt),
        emailVerifiedAt: result.value.user.emailVerifiedAt,
      },
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyEmailSchema))
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(body.token);
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    return { ok: true as const, message: 'Email verified successfully.' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resendVerificationSchema))
  async resendVerification(@Body() body: ResendVerificationDto) {
    const result = await this.authService.resendEmailVerification(
      body.email,
      body.callback,
    );
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    return {
      ok: true as const,
      message:
        'If an unverified account exists, a verification email has been sent.',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(
      body.email,
      body.callback,
    );
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    return {
      ok: true as const,
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(
      body.token,
      body.password,
    );
    if (!result.ok) {
      throw mapAuthErrorToHttpException(result.error);
    }
    res.clearCookie(this.sessionService.cookieName);
    return {
      ok: true as const,
      message:
        'Password has been reset successfully. Please log in with your new password.',
    };
  }
}
