import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
      return false;
    }

    const session = await this.sessionService.validateToken(token);
    if (!session) {
      return false;
    }

    request.session = session;
    request.userId = session.userId;
    return true;
  }
}
