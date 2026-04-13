import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { of, switchMap } from 'rxjs';
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
import {
  EstadoMembresia,
  MembresiaFormValue,
  MembresiaViewModel
} from '../../models/membresia.model';
import {
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
    saldoPendiente: [0, [Validators.min(0)]]
  });

  constructor() {
    this.loadFormData();
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
    controlName: 'socioId' | 'fechaInicio' | 'fechaVencimiento' | 'precioLista' | 'saldoPendiente'
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
          return this.route.paramMap;
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
      saldoPendiente: rawValue.saldoPendiente ?? 0
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo guardar la informacion de la membresia.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
