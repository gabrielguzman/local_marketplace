import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';

// Usar SIEMPRE después de JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException({
        code: 'ADMIN_ONLY',
        message: 'Necesitás permisos de administrador',
      });
    }
    return true;
  }
}
