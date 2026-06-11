import type { UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
