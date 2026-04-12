import { Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../../../shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-asistencias-page',
  standalone: true,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      title="Asistencias"
      description="Vista base lista para registrar ingresos, consultar historial y sumar filtros cuando conectes el backend."
    />
  `
})
export class AsistenciasPageComponent {}
