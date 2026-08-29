import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithSession } from '../guards/session.guard.js';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithSession>();
    return request.userId;
  },
);
