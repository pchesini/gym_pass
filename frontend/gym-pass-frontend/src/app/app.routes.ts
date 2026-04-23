import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'checkin',
    pathMatch: 'full',
    redirectTo: 'asistencias/escaner'
  },
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
        loadChildren: () => import('./features/socios/socios.routes').then((m) => m.sociosRoutes)
      },
      {
        path: 'asistencias',
        loadChildren: () =>
          import('./features/asistencias/asistencias.routes').then((m) => m.asistenciasRoutes)
      },
      {
        path: 'membresias',
        loadChildren: () =>
          import('./features/membresias/membresias.routes').then((m) => m.membresiasRoutes)
      },
      {
        path: 'pagos',
        loadChildren: () => import('./features/pagos/pagos.routes').then((m) => m.pagosRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
