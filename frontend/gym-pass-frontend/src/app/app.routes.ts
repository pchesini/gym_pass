import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          )
      },
      {
        path: 'socios',
        loadComponent: () =>
          import('./features/socios/pages/socios-page/socios-page.component').then(
            (m) => m.SociosPageComponent
          )
      },
      {
        path: 'asistencias',
        loadComponent: () =>
          import('./features/asistencias/pages/asistencias-page/asistencias-page.component').then(
            (m) => m.AsistenciasPageComponent
          )
      },
      {
        path: 'membresias',
        loadComponent: () =>
          import('./features/membresias/pages/membresias-page/membresias-page.component').then(
            (m) => m.MembresiasPageComponent
          )
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('./features/pagos/pages/pagos-page/pagos-page.component').then(
            (m) => m.PagosPageComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
