import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, startWith } from 'rxjs';
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
import { Membresia } from '../../../membresias/models/membresia.model';
import { MembresiasService } from '../../../membresias/services/membresias.service';
import { MetodoPago, PagoPreview, PagoRequest } from '../../models/pago.model';
import { PagosService } from '../../services/pagos.service';

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
  private readonly membresiasService = inject(MembresiasService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly metodosPago: MetodoPago[] = [
    'EFECTIVO',
    'TRANSFERENCIA',
    'TARJETA',
    'MERCADO_PAGO'
  ];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly membresias = signal<Membresia[]>([]);
  protected readonly preview = signal<PagoPreview | null>(null);
  protected readonly loading = signal(true);
  protected readonly previewLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly form = this.formBuilder.group({
    socioId: [null as number | null, [Validators.required]],
    membresiaId: [null as number | null, [Validators.required]],
    fechaPago: [new Date() as Date | null, [Validators.required]],
    monto: [0, [Validators.required, Validators.min(0)]],
    metodoPago: ['EFECTIVO' as MetodoPago, [Validators.required]],
    observaciones: ['', [Validators.maxLength(300)]]
  });

  constructor() {
    this.loadInitialData();
    this.observePreview();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.saving.set(true);

    this.pagosService
      .createPago(payload)
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
      return 'El valor ingresado es demasiado bajo.';
    }

    if (control.hasError('maxlength')) {
      return 'Supera la longitud maxima permitida.';
    }

    return '';
  }

  protected getSelectedSocioName(socioId: number | null): string {
    const socio = this.socios().find((item) => item.id === socioId);
    return socio ? `${socio.nombre} ${socio.apellido}` : '-';
  }

  protected getSelectedMembresiaName(membresiaId: number | null): string {
    const membresia = this.membresias().find((item) => item.id === membresiaId);
    return membresia?.nombre ?? '-';
  }

  private loadInitialData(): void {
    combineLatest([this.sociosService.getSocios(), this.membresiasService.getMembresias()])
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ([socios, membresias]) => {
          this.socios.set(socios);
          this.membresias.set(membresias.filter((membresia) => membresia.estado === 'ACTIVA'));
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  private observePreview(): void {
    combineLatest([
      this.form.controls.socioId.valueChanges.pipe(startWith(this.form.controls.socioId.value)),
      this.form.controls.membresiaId.valueChanges.pipe(
        startWith(this.form.controls.membresiaId.value)
      ),
      this.form.controls.fechaPago.valueChanges.pipe(startWith(this.form.controls.fechaPago.value))
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([socioId, membresiaId, fechaPago]) => {
        if (!socioId || !membresiaId || !fechaPago) {
          this.preview.set(null);
          return;
        }

        this.previewLoading.set(true);

        this.pagosService
          .getPreview(socioId, membresiaId, this.formatDate(fechaPago))
          .pipe(
            finalize(() => this.previewLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: (preview) => {
              this.preview.set(preview);
              if ((this.form.controls.monto.value ?? 0) <= 0 && preview.montoSugerido !== null) {
                this.form.controls.monto.setValue(preview.montoSugerido);
              }
            },
            error: () => {
              this.preview.set(null);
            }
          });
      });
  }

  private buildPayload(): PagoRequest {
    const rawValue = this.form.getRawValue();

    return {
      socioId: Number(rawValue.socioId),
      membresiaId: Number(rawValue.membresiaId),
      fechaPago: this.formatDate(rawValue.fechaPago),
      monto: Number(rawValue.monto ?? 0),
      metodoPago: rawValue.metodoPago ?? 'EFECTIVO',
      observaciones: (rawValue.observaciones ?? '').trim()
    };
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo procesar la informacion del pago.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
