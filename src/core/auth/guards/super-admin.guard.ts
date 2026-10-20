
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AppUserSession } from '../auth.js';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      session?: AppUserSession | null;
    }>();

    const session = request.session;

    if (!session?.user) {
      throw new UnauthorizedException(
        'Debes iniciar sesión',
      );
    }

    if (session.user.role !== 'admin') {
      throw new ForbiddenException(
        'Se requiere acceso de administrador global',
      );
    }

    return true;
  }
}
