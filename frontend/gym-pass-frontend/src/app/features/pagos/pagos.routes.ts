import { Routes } from '@angular/router';

export const pagosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pagos-page/pagos-page.component').then((m) => m.PagosPageComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/pago-form/pago-form.component').then((m) => m.PagoFormComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/pago-detail/pago-detail.component').then((m) => m.PagoDetailComponent)
  }
];
