import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../services/session.service.js';
import { Session } from '../domain/session.entity.js';

export interface RequestWithSession extends Request {
  session?: Session;
  userId?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token: unknown = request.cookies?.[this.sessionService.cookieName];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Authentication session required.');
    }

    const session = await this.sessionService.validateToken(token);
    if (!session) {
      throw new UnauthorizedException('Session is invalid or has expired.');
    }

    request.session = session;
    request.userId = session.userId;
    return true;
  }
}
