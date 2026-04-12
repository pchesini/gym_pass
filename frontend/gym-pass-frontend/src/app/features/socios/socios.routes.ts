import { Routes } from '@angular/router';

export const sociosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/socios-list/socios-list.component').then((m) => m.SociosListComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/socio-form/socio-form.component').then((m) => m.SocioFormComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/socio-form/socio-form.component').then((m) => m.SocioFormComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/socio-detail/socio-detail.component').then(
        (m) => m.SocioDetailComponent
      )
  }
];
