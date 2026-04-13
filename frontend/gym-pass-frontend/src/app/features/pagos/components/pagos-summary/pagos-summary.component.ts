import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CurrencyPipe } from '@angular/common';
import { SociosService } from '../../../socios/services/socios.service';
import { buildPagosSummary } from '../../mappers/pago.mapper';
import { PagosSummaryViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pagos-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pagos-summary.component.html',
  styleUrl: './pagos-summary.component.css'
})
export class PagosSummaryComponent {
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly summary = signal<PagosSummaryViewModel | null>(null);
  readonly currentSummary = computed(() => this.summary());

  constructor() {
    this.loadResumen();
  }

  private loadResumen(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => this.pagosService.getPagos(socios)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pagos) => this.summary.set(buildPagosSummary(pagos)),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.summary.set(null);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el resumen de pagos.';
    }

    return 'Ocurrio un error inesperado al cargar el resumen.';
  }
}
