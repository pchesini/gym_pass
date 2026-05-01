import { Component } from '@angular/core';

import { DeudoresListComponent } from '../../components/deudores-list/deudores-list.component';
import { PagosListComponent } from '../../components/pagos-list/pagos-list.component';
import { PagosSummaryComponent } from '../../components/pagos-summary/pagos-summary.component';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [PagosSummaryComponent, DeudoresListComponent, PagosListComponent],
  templateUrl: './pagos-page.component.html',
  styleUrl: './pagos-page.component.css'
})
export class PagosPageComponent {}
