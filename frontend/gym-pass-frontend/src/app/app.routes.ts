import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      )
  },
  {
    path: '',
    canActivate: [authGuard],
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
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent
          )
      },
      {
        path: 'socios',
        canActivate: [roleGuard(['ADMIN', 'STAFF'])],
        loadChildren: () => import('./features/socios/socios.routes').then((m) => m.sociosRoutes)
      },
      {
        path: 'asistencias',
        canActivate: [roleGuard(['ADMIN', 'STAFF'])],
        loadChildren: () =>
          import('./features/asistencias/asistencias.routes').then((m) => m.asistenciasRoutes)
      },
      {
        path: 'membresias',
        canActivate: [roleGuard(['ADMIN', 'STAFF'])],
        loadChildren: () =>
          import('./features/membresias/membresias.routes').then((m) => m.membresiasRoutes)
      },
      {
        path: 'pagos',
        canActivate: [roleGuard(['ADMIN', 'STAFF'])],
        loadChildren: () => import('./features/pagos/pagos.routes').then((m) => m.pagosRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
