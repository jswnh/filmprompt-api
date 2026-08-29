import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithSession } from '../guards/session.guard.js';
import { User } from '../domain/user.entity.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    return request.user;
  },
);
