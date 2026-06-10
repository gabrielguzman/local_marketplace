import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
