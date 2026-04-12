import { Component } from '@angular/core';

import { PagosListComponent } from '../../components/pagos-list/pagos-list.component';
import { PagosSummaryComponent } from '../../components/pagos-summary/pagos-summary.component';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [PagosSummaryComponent, PagosListComponent],
  templateUrl: './pagos-page.component.html',
  styleUrl: './pagos-page.component.css'
})
export class PagosPageComponent {}
