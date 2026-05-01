import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';

export const membresiasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/membresias-list/membresias-list.component').then(
        (m) => m.MembresiasListComponent
      )
  },
  {
    path: 'nueva',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./components/membresia-form/membresia-form.component').then(
        (m) => m.MembresiaFormComponent
      )
  },
  {
    path: ':id/editar',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () =>
      import('./components/membresia-form/membresia-form.component').then(
        (m) => m.MembresiaFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/membresia-detail/membresia-detail.component').then(
        (m) => m.MembresiaDetailComponent
      )
  }
];
