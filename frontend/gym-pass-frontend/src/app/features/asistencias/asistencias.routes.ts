import { Routes } from '@angular/router';

export const asistenciasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/asistencias-page/asistencias-page.component').then(
        (m) => m.AsistenciasPageComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/asistencia-detail/asistencia-detail.component').then(
        (m) => m.AsistenciaDetailComponent
      )
  }
];
