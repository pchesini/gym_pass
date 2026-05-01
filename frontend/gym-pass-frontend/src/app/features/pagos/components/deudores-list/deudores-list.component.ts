import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { DeudorViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-deudores-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './deudores-list.component.html',
  styleUrl: './deudores-list.component.css'
})
export class DeudoresListComponent {
  private readonly pagosService = inject(PagosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = [
    'socio',
    'membresia',
    'vencimiento',
    'estado',
    'saldoPendiente',
    'acciones'
  ];
  protected readonly deudores = signal<DeudorViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly totalPendiente = computed(() =>
    this.deudores().reduce((total, deudor) => total + deudor.saldoPendiente, 0)
  );

  constructor() {
    this.loadDeudores();
  }

  protected loadDeudores(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.pagosService
      .getDeudores()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (deudores) => this.deudores.set(deudores),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.deudores.set([]);
        }
      });
  }

  protected registrarPago(deudor: DeudorViewModel): void {
    void this.router.navigate(['/pagos/nuevo'], {
      queryParams: {
        socioId: deudor.socioId,
        membresiaId: deudor.membresiaId,
        monto: deudor.saldoPendiente
      }
    });
  }

  protected trackByMembresiaId(_: number, deudor: DeudorViewModel): number {
    return deudor.membresiaId;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el listado de deudores.';
    }

    return 'Ocurrio un error inesperado al consultar deudores.';
  }
}
