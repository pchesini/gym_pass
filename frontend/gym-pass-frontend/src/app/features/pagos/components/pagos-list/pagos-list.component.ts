import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  MatNativeDateModule,
  NativeDateAdapter
} from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { SocioViewModel } from '../../../socios/models/socio.model';
import { SociosService } from '../../../socios/services/socios.service';
import { MetodoPago, PagoViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

const PAGOS_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'dd-MM-yyyy'
  },
  display: {
    dateInput: 'dd-MM-yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd-MM-yyyy',
    monthYearA11yLabel: 'MMMM yyyy'
  }
};

const dateRangeValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const fechaDesde = control.get('fechaDesde')?.value as Date | null;
  const fechaHasta = control.get('fechaHasta')?.value as Date | null;

  if (!fechaDesde || !fechaHasta) {
    return null;
  }

  return fechaHasta < fechaDesde ? { invalidDateRange: true } : null;
};

class PagosDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const normalizedValue = value.trim();
      const match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(normalizedValue);

      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        const parsedDate = new Date(year, month, day);

        if (
          parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month &&
          parsedDate.getDate() === day
        ) {
          return parsedDate;
        }

        return null;
      }
    }

    const parsedDate = super.parse(value);
    return parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  }

  override format(date: Date, _displayFormat: object): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}

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
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    { provide: DateAdapter, useClass: PagosDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: PAGOS_DATE_FORMATS }
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
  protected readonly filteredSummary = computed(() => {
    const pagos = this.pagos();
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((total, pago) => total + pago.monto, 0);
    const promedioPorPago = totalPagos ? Math.round(montoTotal / totalPagos) : 0;
    const ultimoPago = [...pagos].sort((left, right) =>
      (right.fechaPago ?? '').localeCompare(left.fechaPago ?? '')
    )[0] ?? null;

    return {
      totalPagos,
      montoTotal,
      promedioPorPago,
      ultimoPagoFecha: ultimoPago?.fechaPago ?? null,
      ultimoPagoSocio: ultimoPago?.socioNombre ?? null
    };
  });
  protected readonly filtersForm = this.formBuilder.group({
    socio: [''],
    metodoPago: ['' as MetodoPago | ''],
    fechaDesde: [null as Date | null],
    fechaHasta: [null as Date | null],
    busqueda: ['']
  }, {
    validators: [dateRangeValidator]
  });

  constructor() {
    this.observeFilters();
    this.loadPagos();
  }

  protected loadPagos(): void {
    if (this.filtersForm.invalid) {
      return;
    }

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
    }, { emitEvent: false });
    this.loadPagos();
  }

  protected applyQuickRange(range: 'HOY' | 'MES_ACTUAL' | 'MES_ANTERIOR'): void {
    const today = new Date();
    let fechaDesde: Date;
    let fechaHasta: Date;

    if (range === 'HOY') {
      fechaDesde = this.startOfDay(today);
      fechaHasta = this.startOfDay(today);
    } else if (range === 'MES_ACTUAL') {
      fechaDesde = new Date(today.getFullYear(), today.getMonth(), 1);
      fechaHasta = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      fechaDesde = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      fechaHasta = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    this.filtersForm.patchValue(
      {
        fechaDesde,
        fechaHasta
      },
      { emitEvent: false }
    );
    this.loadPagos();
  }

  protected getQuickRangeLabel(): string {
    const fechaDesde = this.filtersForm.controls.fechaDesde.value;
    const fechaHasta = this.filtersForm.controls.fechaHasta.value;

    if (!fechaDesde && !fechaHasta) {
      return 'Sin filtro de fechas';
    }

    if (!fechaDesde || !fechaHasta) {
      return 'Periodo personalizado';
    }

    if (this.isSameDate(fechaDesde, fechaHasta)) {
      return `Dia ${this.formatDisplayDate(fechaDesde)}`;
    }

    return `${this.formatDisplayDate(fechaDesde)} al ${this.formatDisplayDate(fechaHasta)}`;
  }

  protected getFechaDesdeMin(): Date | null {
    return this.filtersForm.controls.fechaDesde.value;
  }

  protected getFechaHastaMax(): Date | null {
    return this.filtersForm.controls.fechaHasta.value;
  }

  protected hasInvalidDateRange(): boolean {
    const fechaDesdeTouched = this.filtersForm.controls.fechaDesde.touched;
    const fechaHastaTouched = this.filtersForm.controls.fechaHasta.touched;
    return this.filtersForm.hasError('invalidDateRange') && (fechaDesdeTouched || fechaHastaTouched);
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
      .subscribe((fechaDesde) => {
        const fechaHasta = this.filtersForm.controls.fechaHasta.value;

        if (fechaDesde && fechaHasta && fechaHasta < fechaDesde) {
          this.filtersForm.controls.fechaHasta.setValue(null);
          return;
        }

        if (this.filtersForm.valid) {
          this.loadPagos();
        }
      });

    this.filtersForm.controls.fechaHasta.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.filtersForm.valid) {
          this.loadPagos();
        }
      });
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

  private formatDisplayDate(date: Date): string {
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isSameDate(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el historial de pagos.';
    }

    return 'Ocurrio un error inesperado al consultar el historial.';
  }
}
