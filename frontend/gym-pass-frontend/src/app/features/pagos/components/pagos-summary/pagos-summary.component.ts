import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { VencimientoProximo } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pagos-summary',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './pagos-summary.component.html',
  styleUrl: './pagos-summary.component.css'
})
export class PagosSummaryComponent {
  private readonly pagosService = inject(PagosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly vencimientos = signal<VencimientoProximo[]>([]);

  constructor() {
    this.loadVencimientos();
  }

  private loadVencimientos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.pagosService
      .getVencimientosProximos()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (vencimientos) => this.vencimientos.set(vencimientos.slice(0, 4)),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.vencimientos.set([]);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudieron obtener los vencimientos proximos.';
    }

    return 'Ocurrio un error inesperado al cargar el resumen.';
  }
}
