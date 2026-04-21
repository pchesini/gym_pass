import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SocioViewModel } from '../../../socios/models/socio.model';
import { SociosService } from '../../../socios/services/socios.service';
import { buildPagoPreview, mapPagoFormToCreateRequest } from '../../mappers/pago.mapper';
import { MetodoPago, PagoFormValue, PagoPreviewViewModel } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

type PagoFormRawValue = {
  socioId?: number | null;
  membresiaId?: number | null;
  fechaPago?: Date | null;
  monto?: number | null;
  metodoPago?: MetodoPago | null;
  observaciones?: string | null;
};

@Component({
  selector: 'app-pago-form',
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
    MatSnackBarModule
  ],
  templateUrl: './pago-form.component.html',
  styleUrl: './pago-form.component.css'
})
export class PagoFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly pagosService = inject(PagosService);
  private readonly sociosService = inject(SociosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly metodosPago: MetodoPago[] = [
    'CREDITO',
    'DEBITO',
    'EFECTIVO',
    'TRANSFERENCIA',
    'OTRO'
  ];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly preview = signal<PagoPreviewViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly form = this.formBuilder.group({
    socioId: [null as number | null, [Validators.required]],
    membresiaId: [null as number | null],
    fechaPago: [new Date() as Date | null, [Validators.required]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    metodoPago: ['EFECTIVO' as MetodoPago, [Validators.required]],
    observaciones: ['', [Validators.maxLength(300)]]
  });

  constructor() {
    this.prefillFromQueryParams();
    this.loadInitialData();
    this.observePreview();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.pagosService
      .createPago(mapPagoFormToCreateRequest(this.buildPayload()))
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pago) => {
          this.snackBar.open('Pago registrado correctamente.', 'Cerrar', { duration: 3000 });
          void this.router.navigate(['/pagos', pago.id]);
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  protected getErrorMessage(
    controlName: 'socioId' | 'membresiaId' | 'fechaPago' | 'monto' | 'metodoPago' | 'observaciones'
  ): string {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'Ingresa un monto mayor a cero.';
    }

    if (control.hasError('maxlength')) {
      return 'Supera la longitud maxima permitida.';
    }

    return '';
  }

  private loadInitialData(): void {
    this.sociosService
      .getSocios()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socios) => {
          this.socios.set(socios);
          this.preview.set(
            buildPagoPreview(
              this.buildPayload(),
              socios.find((socio) => socio.id === this.form.controls.socioId.value)
            )
          );
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  private prefillFromQueryParams(): void {
    const socioIdParam = this.route.snapshot.queryParamMap.get('socioId');
    const membresiaIdParam = this.route.snapshot.queryParamMap.get('membresiaId');
    const montoParam = this.route.snapshot.queryParamMap.get('monto');

    this.form.patchValue({
      socioId: socioIdParam ? Number(socioIdParam) : null,
      membresiaId: membresiaIdParam ? Number(membresiaIdParam) : null,
      monto: montoParam ? Number(montoParam) : this.form.controls.monto.value
    });
  }

  private observePreview(): void {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const formValue = this.normalizeFormValue(value);
        const socio = this.socios().find((item) => item.id === formValue.socioId);
        this.preview.set(buildPagoPreview(formValue, socio));
      });
  }

  private buildPayload(): PagoFormValue {
    return this.normalizeFormValue(this.form.getRawValue());
  }

  private normalizeFormValue(value: PagoFormRawValue): PagoFormValue {
    return {
      socioId: value.socioId ?? null,
      membresiaId: value.membresiaId ?? null,
      fechaPago: value.fechaPago ?? null,
      monto: value.monto ?? null,
      metodoPago: value.metodoPago ?? 'EFECTIVO',
      observaciones: value.observaciones ?? ''
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo procesar la informacion del pago.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
