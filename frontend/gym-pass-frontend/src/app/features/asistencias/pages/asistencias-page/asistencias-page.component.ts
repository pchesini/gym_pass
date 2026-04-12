import { Component } from '@angular/core';

import { AsistenciasCheckinComponent } from '../../components/asistencias-checkin/asistencias-checkin.component';
import { AsistenciasListComponent } from '../../components/asistencias-list/asistencias-list.component';

@Component({
  selector: 'app-asistencias-page',
  standalone: true,
  imports: [AsistenciasCheckinComponent, AsistenciasListComponent],
  templateUrl: './asistencias-page.component.html',
  styleUrl: './asistencias-page.component.css'
})
export class AsistenciasPageComponent {}
