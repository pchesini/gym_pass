import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RolUsuario } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasAnyRole(roles)) {
      return true;
    }

    return router.createUrlTree([authService.getDefaultRoute()]);
  };
};
