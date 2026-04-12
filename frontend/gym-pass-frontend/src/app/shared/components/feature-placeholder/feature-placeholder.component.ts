import { Component, input } from '@angular/core';

import { MATERIAL_IMPORTS } from '../../material/material-imports';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './feature-placeholder.component.html',
  styleUrl: './feature-placeholder.component.css'
})
export class FeaturePlaceholderComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
