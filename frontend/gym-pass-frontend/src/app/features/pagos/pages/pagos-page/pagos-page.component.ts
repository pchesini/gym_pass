import { Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../../../shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      title="Pagos"
      description="Pantalla inicial para futuros listados, formularios y reportes de pagos conectados a la API REST."
    />
  `
})
export class PagosPageComponent {}
