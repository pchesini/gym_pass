import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SociosService } from '../../../socios/services/socios.service';
import { PagoViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pago-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pago-detail.component.html',
  styleUrl: './pago-detail.component.css'
})
export class PagoDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pago = signal<PagoViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadPago();
  }

  private loadPago(): void {
    const pagoIdParam = this.route.snapshot.paramMap.get('id');
    const pagoId = pagoIdParam ? Number(pagoIdParam) : null;

    if (!Number.isFinite(pagoId) || pagoId === null) {
      this.errorMessage.set('El identificador del pago no es valido.');
      this.loading.set(false);
      return;
    }

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => this.pagosService.getPagoById(pagoId, socios)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pago) => this.pago.set(pago),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el detalle del pago.';
    }

    return 'Ocurrio un error inesperado al cargar el detalle.';
  }
}
