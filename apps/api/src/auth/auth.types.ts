import type { Request } from 'express';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
