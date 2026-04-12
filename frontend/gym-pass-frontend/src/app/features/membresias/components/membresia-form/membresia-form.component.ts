import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { EstadoMembresia, Membresia, MembresiaRequest } from '../../models/membresia.model';
import { MembresiasService } from '../../services/membresias.service';

@Component({
  selector: 'app-membresia-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estados: EstadoMembresia[] = ['ACTIVA', 'INACTIVA'];
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly currentMembresia = signal<Membresia | null>(null);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar membresia' : 'Alta de membresia'
  );
  protected readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Actualiza la configuracion del plan sin perder consistencia para futuras asociaciones con socios.'
      : 'Crea un nuevo plan reusable para asignar despues a socios, pagos y renovaciones.'
  );
  protected readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.maxLength(240)]],
    duracionDias: [30, [Validators.required, Validators.min(1), Validators.max(3650)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    estado: ['ACTIVA' as EstadoMembresia, [Validators.required]]
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
    const membresiaId = this.currentMembresia()?.id;
    const request$ =
      this.isEditMode() && membresiaId
        ? this.membresiasService.updateMembresia(membresiaId, payload)
        : this.membresiasService.createMembresia(payload);

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
    controlName: 'nombre' | 'descripcion' | 'duracionDias' | 'precio' | 'estado'
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

    if (control.hasError('max')) {
      return 'El valor ingresado supera el maximo permitido.';
    }

    return '';
  }

  private loadFormData(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const membresiaIdParam = params.get('id');
          const membresiaId = membresiaIdParam ? Number(membresiaIdParam) : null;
          const isEditMode = Number.isFinite(membresiaId) && membresiaId !== null;

          this.isEditMode.set(isEditMode);

          if (!isEditMode || !membresiaId) {
            return of(null);
          }

          return this.membresiasService.getMembresiaById(membresiaId);
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

  private patchForm(membresia: Membresia): void {
    this.form.patchValue({
      nombre: membresia.nombre,
      descripcion: membresia.descripcion,
      duracionDias: membresia.duracionDias,
      precio: membresia.precio,
      estado: membresia.estado
    });
  }

  private buildPayload(): MembresiaRequest {
    const rawValue = this.form.getRawValue();

    return {
      nombre: (rawValue.nombre ?? '').trim(),
      descripcion: (rawValue.descripcion ?? '').trim(),
      duracionDias: Number(rawValue.duracionDias ?? 0),
      precio: Number(rawValue.precio ?? 0),
      estado: rawValue.estado ?? 'ACTIVA'
    };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo guardar la informacion de la membresia.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
