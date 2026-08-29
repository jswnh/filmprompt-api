import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe.js';
import { type SignUpDto, signUpSchema } from '../dto/sign-up.dto.js';
import { type SignInDto, signInSchema } from '../dto/sign-in.dto.js';
import {
  SessionGuard,
  type RequestWithSession,
} from '../guards/session.guard.js';
import { CurrentUserId } from '../decorators/current-user-id.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('sign-up')
  @UsePipes(new ZodValidationPipe(signUpSchema))
  async signUp(@Body() body: SignUpDto) {
    const result = await this.authService.signUp(body);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }
    return {
      ok: true as const,
      user: { id: result.value.id, email: result.value.email },
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
      return { ok: false as const, error: result.error };
    }

    const { session, rawToken } = result.value.session;
    res.cookie(
      this.sessionService.cookieName,
      rawToken,
      this.sessionService.getCookieOptions(session.rememberMe),
    );

    return {
      ok: true as const,
      user: {
        id: result.value.user.id,
        email: result.value.user.email,
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
      await this.authService.signOut(req.session.id);
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
    await this.authService.signOutAllDevices(userId);
    res.clearCookie(this.sessionService.cookieName);
    return { ok: true as const };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUserId() userId: string) {
    return { ok: true as const, userId };
  }
}
