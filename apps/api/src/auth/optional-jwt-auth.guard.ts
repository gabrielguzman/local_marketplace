import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

// Adjunta req.user si hay un Bearer válido, pero NO rechaza si falta.
// Para endpoints que sirven tanto a usuarios logueados como a invitados.
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme === 'Bearer' && token) {
      try {
        req.user = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      } catch {
        // token inválido/expirado: seguimos como invitado
      }
    }
    return true;
  }
}
