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

  protected trackByMetricGroup(
    _: number,
    group: DashboardSummaryViewModel['metricGroups'][number]
  ): string {
    return group.title;
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

  protected trackByMembresiaId(
    _: number,
    membresia:
      | NonNullable<DashboardSummaryViewModel['membresiasPorVencer']>[number]
      | NonNullable<DashboardSummaryViewModel['membresiasConDeuda']>[number]
  ): number {
    return membresia.id;
  }

  protected trackBySocioId(
    _: number,
    socio: NonNullable<DashboardSummaryViewModel['sociosRecientes']>[number]
  ): number {
    return socio.id;
  }

  protected trackByTopSocioAsistencia(
    index: number,
    socio: NonNullable<DashboardSummaryViewModel['topSociosAsistencias']>[number]
  ): number {
    return socio.socioId ?? index;
  }

  protected trackBySocioAsistencia(
    index: number,
    socio:
      | NonNullable<DashboardSummaryViewModel['topSociosAsistencias']>[number]
      | NonNullable<DashboardSummaryViewModel['sociosMenosAsistencias']>[number]
  ): number {
    return socio.socioId ?? index;
  }

  protected trackByString(_: number, value: string): string {
    return value;
  }

  protected trackByFranjaAsistencia(
    index: number,
    item: DashboardSummaryViewModel['asistenciasPorFranjaHoraria'][number]
  ): string {
    return item.franja ?? index.toString();
  }

  protected getHeatmapCantidad(
    summary: DashboardSummaryViewModel,
    dia: string,
    franja: string
  ): number {
    return (
      summary.asistenciasPorDiaYFranja.find(
        (item) => item.dia === dia && item.franja === franja
      )?.cantidad ?? 0
    );
  }

  protected getHeatmapClass(cantidad: number, maxCantidad: number): string {
    if (!cantidad || !maxCantidad) {
      return 'heatmap-cell heatmap-cell--empty';
    }

    const ratio = cantidad / maxCantidad;

    if (ratio >= 0.75) {
      return 'heatmap-cell heatmap-cell--high';
    }

    if (ratio >= 0.45) {
      return 'heatmap-cell heatmap-cell--medium';
    }

    return 'heatmap-cell heatmap-cell--low';
  }

  protected getBarWidth(cantidad: number, maxCantidad: number): string {
    if (!cantidad || !maxCantidad) {
      return '0%';
    }

    return `${Math.max(8, Math.round((cantidad / maxCantidad) * 100))}%`;
  }

  protected getHeatmapGridColumns(summary: DashboardSummaryViewModel): string {
    return `92px repeat(${summary.franjasAsistencia.length}, minmax(92px, 1fr))`;
  }

  protected getHeatmapMinWidth(summary: DashboardSummaryViewModel): string {
    return `${92 + summary.franjasAsistencia.length * 98}px`;
  }

  protected getDiasParaVencimientoLabel(fechaVencimiento: string | null): string {
    const dias = this.getDiasParaVencimiento(fechaVencimiento);

    if (dias === null) {
      return 'Sin fecha de vencimiento';
    }

    if (dias < 0) {
      const diasVencida = Math.abs(dias);
      return diasVencida === 1 ? 'Vencida hace 1 dia' : `Vencida hace ${diasVencida} dias`;
    }

    if (dias === 0) {
      return 'Vence hoy';
    }

    return dias === 1 ? 'Falta 1 dia' : `Faltan ${dias} dias`;
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

  private getDiasParaVencimiento(fechaVencimiento: string | null): number | null {
    const fecha = this.parseLocalDate(fechaVencimiento);

    if (!fecha) {
      return null;
    }

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.round((fecha.getTime() - inicioHoy.getTime()) / millisecondsPerDay);
  }

  private parseLocalDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
}
