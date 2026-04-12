import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

import {
  mapSocioFormValueToCreateApiRequest,
  mapSocioFormValueToUpdateApiRequest
} from '../../mappers/socio.mapper';
import { EstadoSocio, SocioFormValue, SocioViewModel } from '../../models/socio.model';
import { SociosService } from '../../services/socios.service';

@Component({
  selector: 'app-socio-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
  templateUrl: './socio-form.component.html',
  styleUrl: './socio-form.component.css'
})
export class SocioFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly sociosService = inject(SociosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estados: EstadoSocio[] = ['ACTIVO', 'INACTIVO'];
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly currentSocio = signal<SocioViewModel | null>(null);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar socio' : 'Alta de socio'
  );
  protected readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Actualiza los datos principales del socio segun el contrato real del backend.'
      : 'Registra un nuevo socio con los datos disponibles actualmente en la API.'
  );
  protected readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    apellido: ['', [Validators.maxLength(80)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    fechaNacimiento: [null as Date | null],
    estado: ['ACTIVO' as EstadoSocio, [Validators.required]]
  });

  constructor() {
    this.loadFormData();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    const socioId = this.currentSocio()?.id;
    this.saving.set(true);

    if (this.isEditMode() && socioId) {
      this.sociosService
        .updateSocio(socioId, payload.updateRequest)
        .pipe(
          switchMap((updatedSocio) => {
            if (updatedSocio.estado !== payload.estado) {
              return this.sociosService.updateEstado(updatedSocio.id, payload.estado);
            }

            return of(updatedSocio);
          }),
          finalize(() => this.saving.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (socio) => {
            this.snackBar.open('Socio actualizado correctamente.', 'Cerrar', {
              duration: 3000
            });
            void this.router.navigate(['/socios', socio.id]);
          },
          error: (error) => {
            this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
          }
        });

      return;
    }

    this.sociosService
      .createSocio(payload.createRequest)
      .pipe(
        switchMap((createdSocio) => {
          if (payload.estado !== 'ACTIVO') {
            return this.sociosService.updateEstado(createdSocio.id, payload.estado);
          }

          return of(createdSocio);
        }),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socio) => {
          this.snackBar.open('Socio creado correctamente.', 'Cerrar', {
            duration: 3000
          });
          void this.router.navigate(['/socios', socio.id]);
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  protected getErrorMessage(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un email valido.';
    }

    if (control.hasError('maxlength')) {
      return 'Supera la longitud maxima permitida.';
    }

    if (control.hasError('pattern')) {
      return 'El formato ingresado no es valido.';
    }

    return '';
  }

  private loadFormData(): void {
    this.loading.set(true);

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const socioIdParam = params.get('id');
          const socioId = socioIdParam ? Number(socioIdParam) : null;
          const isEditMode = Number.isFinite(socioId) && socioId !== null;

          this.isEditMode.set(isEditMode);

          if (!isEditMode || !socioId) {
            return of(null);
          }

          return this.sociosService.getSocioById(socioId);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socio) => {
          if (socio) {
            this.currentSocio.set(socio);
            this.patchForm(socio);
            this.form.controls.dni.disable({ emitEvent: false });
          }
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  private patchForm(socio: SocioViewModel): void {
    this.form.patchValue({
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      email: socio.email,
      telefono: socio.telefono,
      fechaNacimiento: socio.fechaNacimiento ? new Date(socio.fechaNacimiento) : null,
      estado: socio.estado
    });
  }

  private buildPayload(): {
    createRequest: ReturnType<typeof mapSocioFormValueToCreateApiRequest>;
    updateRequest: ReturnType<typeof mapSocioFormValueToUpdateApiRequest>;
    estado: EstadoSocio;
  } {
    const rawValue = this.form.getRawValue();

    const formValue: SocioFormValue = {
      nombre: (rawValue.nombre ?? '').trim(),
      apellido: (rawValue.apellido ?? '').trim(),
      dni: (rawValue.dni ?? '').trim(),
      email: (rawValue.email ?? '').trim(),
      telefono: (rawValue.telefono ?? '').trim(),
      estado: rawValue.estado ?? 'ACTIVO',
      fechaNacimiento: rawValue.fechaNacimiento
    };

    return {
      createRequest: mapSocioFormValueToCreateApiRequest(formValue),
      updateRequest: mapSocioFormValueToUpdateApiRequest(formValue),
      estado: formValue.estado
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo guardar la informacion del socio.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
