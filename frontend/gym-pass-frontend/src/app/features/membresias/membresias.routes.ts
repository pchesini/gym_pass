import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./components/membresia-form/membresia-form.component').then(
        (m) => m.MembresiaFormComponent
      )
  },
  {
    path: ':id/editar',
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
