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
    path: 'escaner',
    loadComponent: () =>
      import('./pages/asistencias-scanner-page/asistencias-scanner-page.component').then(
        (m) => m.AsistenciasScannerPageComponent
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
