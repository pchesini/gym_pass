import { Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../../../shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-socios-page',
  standalone: true,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      title="Socios"
      description="Modulo preparado para administrar altas, bajas, estados y futuras integraciones con membresias y pagos."
    />
  `
})
export class SociosPageComponent {}
