import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DashboardSummaryViewModel } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly summary = signal<DashboardSummaryViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadDashboard();
  }

  protected trackByMetricLabel(_: number, metric: DashboardSummaryViewModel['metrics'][number]): string {
    return metric.label;
  }

  protected trackByPagoId(_: number, pago: NonNullable<DashboardSummaryViewModel['ultimosPagos']>[number]): number {
    return pago.id;
  }

  protected trackByAsistenciaId(
    _: number,
    asistencia: NonNullable<DashboardSummaryViewModel['ultimasAsistencias']>[number]
  ): number {
    return asistencia.id;
  }

  protected trackBySocioId(
    _: number,
    socio: NonNullable<DashboardSummaryViewModel['sociosRecientes']>[number]
  ): number {
    return socio.id;
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService
      .getDashboardSummary()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.summary.set(null);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el dashboard.';
    }

    return 'Ocurrio un error inesperado al cargar el resumen general.';
  }
}
