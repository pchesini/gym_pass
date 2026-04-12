import { Component } from '@angular/core';

import { FeaturePlaceholderComponent } from '../../../../shared/components/feature-placeholder/feature-placeholder.component';

@Component({
  selector: 'app-membresias-page',
  standalone: true,
  imports: [FeaturePlaceholderComponent],
  template: `
    <app-feature-placeholder
      title="Membresias"
      description="Espacio preparado para listar planes, vencimientos y renovaciones sin mezclar la logica con el layout."
    />
  `
})
export class MembresiasPageComponent {}
