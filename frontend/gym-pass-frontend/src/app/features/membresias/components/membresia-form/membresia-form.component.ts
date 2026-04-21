import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { of, switchMap, take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import {
  EstadoMembresia,
  MembresiaFormValue,
  MembresiaViewModel
} from '../../models/membresia.model';
import {
  mapMembresiaFormToCreateWithPagoRequest,
  mapMembresiaFormToCreateRequest,
  mapMembresiaFormToUpdateRequest
} from '../../mappers/membresia.mapper';
import { MembresiasService } from '../../services/membresias.service';

@Component({
  selector: 'app-membresia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './membresia-form.component.html',
  styleUrl: './membresia-form.component.css'
})
export class MembresiaFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estados: EstadoMembresia[] = [
    'ACTIVA',
    'VENCIDA',
    'CANCELADA',
    'PENDIENTE_PAGO'
  ];
  protected readonly metodosPago = [
    'EFECTIVO',
    'TRANSFERENCIA',
    'DEBITO',
    'CREDITO',
    'OTRO'
  ] as const;
  protected readonly saldoRestante = computed(() => {
    const precioLista = Number(this.form.controls.precioLista.value ?? 0);
    const montoPagado = Number(this.form.controls.montoPagado.value ?? 0);
    return Math.max(precioLista - montoPagado, 0);
  });
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly currentMembresia = signal<MembresiaViewModel | null>(null);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar membresia asignada' : 'Nueva membresia asignada'
  );
  protected readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Actualiza fechas, precio y saldo de una membresia ya asignada a un socio.'
      : 'Crea una nueva membresia vinculada a un socio real del sistema.'
  );
  protected readonly form = this.formBuilder.group({
    socioId: [null as number | null, [Validators.required]],
    fechaInicio: [new Date() as Date | null, [Validators.required]],
    fechaVencimiento: [null as Date | null, [Validators.required]],
    precioLista: [0, [Validators.required, Validators.min(0)]],
    saldoPendiente: [0, [Validators.min(0)]],
    registrarPagoInicial: [false],
    montoPagado: [0],
    metodoPago: ['EFECTIVO' as MembresiaFormValue['metodoPago']],
    observacionesPago: ['', [Validators.maxLength(300)]]
  });

  constructor() {
    this.loadFormData();
    this.observePagoInicial();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const membresiaId = this.currentMembresia()?.id;
    const request$ =
      this.isEditMode() && membresiaId
        ? this.membresiasService.updateMembresia(
            membresiaId,
            mapMembresiaFormToUpdateRequest(this.buildPayload())
          )
        : this.form.controls.registrarPagoInicial.value
          ? this.membresiasService.createMembresiaConPagoInicial(
              mapMembresiaFormToCreateWithPagoRequest(this.buildPayload())
            )
          : this.membresiasService.createMembresia(
              mapMembresiaFormToCreateRequest(this.buildPayload())
            );

    this.saving.set(true);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (membresia) => {
          this.snackBar.open(
            this.isEditMode()
              ? 'Membresia actualizada correctamente.'
              : 'Membresia creada correctamente.',
            'Cerrar',
            { duration: 3000 }
          );
          void this.router.navigate(['/membresias', membresia.id]);
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  protected getErrorMessage(
    controlName:
      | 'socioId'
      | 'fechaInicio'
      | 'fechaVencimiento'
      | 'precioLista'
      | 'saldoPendiente'
      | 'montoPagado'
      | 'metodoPago'
      | 'observacionesPago'
  ): string {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return 'Supera la longitud maxima permitida.';
    }

    if (control.hasError('min')) {
      return 'El valor ingresado es demasiado bajo.';
    }

    return '';
  }

  private loadFormData(): void {
    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => {
          this.socios.set(socios);
          return this.route.paramMap.pipe(take(1));
        }),
        switchMap((params) => {
          const membresiaIdParam = params.get('id');
          const membresiaId = membresiaIdParam ? Number(membresiaIdParam) : null;
          const isEditMode = Number.isFinite(membresiaId) && membresiaId !== null;

          this.isEditMode.set(isEditMode);

          if (!isEditMode || !membresiaId) {
            const socioIdQuery = this.route.snapshot.queryParamMap.get('socioId');
            const socioId = socioIdQuery ? Number(socioIdQuery) : null;
            if (Number.isFinite(socioId) && socioId !== null) {
              this.form.controls.socioId.setValue(socioId);
            }
            return of(null);
          }

          return this.membresiasService.getMembresiaById(membresiaId, this.socios());
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (membresia) => {
          if (membresia) {
            this.currentMembresia.set(membresia);
            this.patchForm(membresia);
          }
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  private observePagoInicial(): void {
    this.form.controls.registrarPagoInicial.valueChanges
      .pipe(startWith(this.form.controls.registrarPagoInicial.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((registrarPagoInicial) => {
        const shouldRegister = !!registrarPagoInicial && !this.isEditMode();

        if (shouldRegister) {
          this.form.controls.montoPagado.setValidators([Validators.required, Validators.min(0.01)]);
          this.form.controls.metodoPago.setValidators([Validators.required]);
          this.form.controls.saldoPendiente.disable({ emitEvent: false });
          this.form.controls.saldoPendiente.setValue(this.saldoRestante(), { emitEvent: false });
        } else {
          this.form.controls.montoPagado.clearValidators();
          this.form.controls.metodoPago.clearValidators();
          this.form.controls.saldoPendiente.enable({ emitEvent: false });
        }

        this.form.controls.montoPagado.updateValueAndValidity({ emitEvent: false });
        this.form.controls.metodoPago.updateValueAndValidity({ emitEvent: false });
      });

    this.form.controls.precioLista.valueChanges
      .pipe(startWith(this.form.controls.precioLista.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncSaldoPendienteFromPago());

    this.form.controls.montoPagado.valueChanges
      .pipe(startWith(this.form.controls.montoPagado.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncSaldoPendienteFromPago());
  }

  private patchForm(membresia: MembresiaViewModel): void {
    this.form.patchValue({
      socioId: membresia.socioId,
      fechaInicio: membresia.fechaInicio ? new Date(membresia.fechaInicio) : null,
      fechaVencimiento: membresia.fechaVencimiento ? new Date(membresia.fechaVencimiento) : null,
      precioLista: membresia.precioLista ?? 0,
      saldoPendiente: membresia.saldoPendiente ?? 0
    });
    this.form.controls.socioId.disable();
  }

  private buildPayload(): MembresiaFormValue {
    const rawValue = this.form.getRawValue();

    return {
      socioId: rawValue.socioId ?? this.currentMembresia()?.socioId ?? null,
      fechaInicio: rawValue.fechaInicio ?? null,
      fechaVencimiento: rawValue.fechaVencimiento ?? null,
      precioLista: rawValue.precioLista ?? 0,
      saldoPendiente: rawValue.registrarPagoInicial ? this.saldoRestante() : (rawValue.saldoPendiente ?? 0),
      registrarPagoInicial: rawValue.registrarPagoInicial ?? false,
      montoPagado: rawValue.montoPagado ?? 0,
      metodoPago: rawValue.metodoPago ?? 'EFECTIVO',
      observacionesPago: rawValue.observacionesPago ?? ''
    };
  }

  private syncSaldoPendienteFromPago(): void {
    if (!this.form.controls.registrarPagoInicial.value || this.isEditMode()) {
      return;
    }

    this.form.controls.saldoPendiente.setValue(this.saldoRestante(), { emitEvent: false });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo guardar la informacion de la membresia.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
