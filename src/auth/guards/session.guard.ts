import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../services/session.service.js';
import { Session } from '../domain/session.entity.js';
import { User } from '../domain/user.entity.js';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../interfaces/user-repository.interface.js';

export interface RequestWithSession extends Request {
  session?: Session;
  user?: User;
  userId?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

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

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException(
        'User associated with this session no longer exists.',
      );
    }

    request.session = session;
    request.user = user;
    request.userId = user.id;
    return true;
  }
}
