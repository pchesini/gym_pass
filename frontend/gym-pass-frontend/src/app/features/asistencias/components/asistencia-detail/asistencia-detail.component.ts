import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SociosService } from '../../../socios/services/socios.service';
import { formatAsistenciaDateTime } from '../../mappers/asistencia.mapper';
import { AsistenciaViewModel, EstadoAsistencia } from '../../models/asistencia.model';
import { AsistenciasService } from '../../services/asistencias.service';

@Component({
  selector: 'app-asistencia-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './asistencia-detail.component.html',
  styleUrl: './asistencia-detail.component.css'
})
export class AsistenciaDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly sociosService = inject(SociosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly asistencia = signal<AsistenciaViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly formatFechaHora = formatAsistenciaDateTime;

  constructor() {
    this.loadAsistencia();
  }

  protected getEstadoClass(estado: EstadoAsistencia): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
  }

  private loadAsistencia(): void {
    const asistenciaIdParam = this.route.snapshot.paramMap.get('id');
    const asistenciaId = asistenciaIdParam ? Number(asistenciaIdParam) : null;

    if (!Number.isFinite(asistenciaId) || asistenciaId === null) {
      this.errorMessage.set('El identificador de asistencia no es valido.');
      this.loading.set(false);
      return;
    }

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => this.asistenciasService.getAsistenciaById(asistenciaId, socios)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (asistencia) => this.asistencia.set(asistencia),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el detalle de la asistencia.';
    }

    return 'Ocurrio un error inesperado al cargar el detalle.';
  }
}
