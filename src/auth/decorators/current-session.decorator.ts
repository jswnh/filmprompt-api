import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithSession } from '../guards/session.guard.js';
import { Session } from '../domain/session.entity.js';

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Session | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    return request.session;
  },
);
