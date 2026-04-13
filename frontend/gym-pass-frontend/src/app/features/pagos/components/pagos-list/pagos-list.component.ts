import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { SocioViewModel } from '../../../socios/models/socio.model';
import { SociosService } from '../../../socios/services/socios.service';
import { MetodoPago, PagoViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

@Component({
  selector: 'app-pagos-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './pagos-list.component.html',
  styleUrl: './pagos-list.component.css'
})
export class PagosListComponent {
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly metodosPago: MetodoPago[] = [
    'CREDITO',
    'DEBITO',
    'EFECTIVO',
    'TRANSFERENCIA',
    'OTRO'
  ];
  protected readonly displayedColumns = [
    'id',
    'socio',
    'membresia',
    'fechaPago',
    'monto',
    'metodoPago',
    'observaciones',
    'acciones'
  ];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly pagos = signal<PagoViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly filtersForm = this.formBuilder.group({
    socio: [''],
    metodoPago: ['' as MetodoPago | ''],
    fechaDesde: [null as Date | null],
    fechaHasta: [null as Date | null],
    busqueda: ['']
  });

  constructor() {
    this.observeFilters();
    this.loadPagos();
  }

  protected loadPagos(): void {
    const rawValue = this.filtersForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => {
          this.socios.set(socios);
          return this.pagosService.getPagos(socios);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pagos) =>
          this.pagos.set(
            this.pagosService.filterPagos(pagos, {
              socio: rawValue.socio ?? '',
              metodoPago: rawValue.metodoPago ?? '',
              fechaDesde: this.formatDate(rawValue.fechaDesde),
              fechaHasta: this.formatDate(rawValue.fechaHasta),
              busqueda: rawValue.busqueda ?? ''
            })
          ),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.pagos.set([]);
        }
      });
  }

  protected clearFilters(): void {
    this.filtersForm.patchValue({
      socio: '',
      metodoPago: '',
      fechaDesde: null,
      fechaHasta: null,
      busqueda: ''
    });
    this.loadPagos();
  }

  protected goToDetail(pagoId: number): void {
    void this.router.navigate(['/pagos', pagoId]);
  }

  protected trackByPagoId(_: number, pago: PagoViewModel): number {
    return pago.id;
  }

  private observeFilters(): void {
    this.filtersForm.controls.socio.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPagos());

    this.filtersForm.controls.busqueda.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPagos());

    this.filtersForm.controls.metodoPago.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPagos());

    this.filtersForm.controls.fechaDesde.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPagos());

    this.filtersForm.controls.fechaHasta.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPagos());
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el historial de pagos.';
    }

    return 'Ocurrio un error inesperado al consultar el historial.';
  }
}
