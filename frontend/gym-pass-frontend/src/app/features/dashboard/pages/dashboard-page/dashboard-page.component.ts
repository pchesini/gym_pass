import { Component } from '@angular/core';

import { MATERIAL_IMPORTS } from '../../../../shared/material/material-imports';

interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  protected readonly metrics: DashboardMetric[] = [
    {
      label: 'Socios activos',
      value: '124',
      helper: 'Dato de ejemplo para conectar al backend luego.'
    },
    {
      label: 'Asistencias del dia',
      value: '37',
      helper: 'Ideal para mostrar actividad en tiempo real.'
    },
    {
      label: 'Pagos del mes',
      value: '$ 1.280.000',
      helper: 'Resumen mensual preparado para integracion futura.'
    },
    {
      label: 'Vencimientos proximos',
      value: '18',
      helper: 'Pensado para alertas de membresias por vencer.'
    }
  ];
}
