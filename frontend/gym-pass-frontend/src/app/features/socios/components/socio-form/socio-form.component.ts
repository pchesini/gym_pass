import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
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

import { EstadoSocio, PlanSocio, Socio, SocioRequest } from '../../models/socio.model';
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

  protected readonly estados: EstadoSocio[] = ['ACTIVO', 'INACTIVO', 'MOROSO'];
  protected readonly planes = signal<PlanSocio[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly isEditMode = signal(false);
  protected readonly currentSocio = signal<Socio | null>(null);
  protected readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Editar socio' : 'Alta de socio'
  );
  protected readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Actualiza los datos principales del socio y su plan vigente.'
      : 'Registra un nuevo socio con los datos necesarios para integrar membresias y pagos.'
  );
  protected readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    apellido: ['', [Validators.required, Validators.maxLength(60)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    fechaNacimiento: [null as Date | null, [Validators.required]],
    direccion: ['', [Validators.required, Validators.maxLength(150)]],
    fechaAlta: [new Date() as Date | null, [Validators.required]],
    estado: ['ACTIVO' as EstadoSocio, [Validators.required]],
    planId: [null as number | null, [Validators.required]]
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
    const request$ =
      this.isEditMode() && socioId
        ? this.sociosService.updateSocio(socioId, payload)
        : this.sociosService.createSocio(payload);

    this.saving.set(true);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socio) => {
          this.snackBar.open(
            this.isEditMode() ? 'Socio actualizado correctamente.' : 'Socio creado correctamente.',
            'Cerrar',
            { duration: 3000 }
          );
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
    const socioIdParam = this.route.snapshot.paramMap.get('id');
    const socioId = socioIdParam ? Number(socioIdParam) : null;
    const isEditMode = Number.isFinite(socioId) && socioId !== null;

    this.isEditMode.set(isEditMode);
    this.loading.set(true);

    forkJoin({
      planes: this.sociosService.getPlanes(),
      socio: isEditMode && socioId ? this.sociosService.getSocioById(socioId) : of(null)
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ planes, socio }) => {
          this.planes.set(planes);

          if (socio) {
            this.currentSocio.set(socio);
            this.patchForm(socio);
          }
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4500 });
        }
      });
  }

  private patchForm(socio: Socio): void {
    this.form.patchValue({
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      email: socio.email,
      telefono: socio.telefono,
      fechaNacimiento: socio.fechaNacimiento ? new Date(socio.fechaNacimiento) : null,
      direccion: socio.direccion,
      fechaAlta: socio.fechaAlta ? new Date(socio.fechaAlta) : null,
      estado: socio.estado,
      planId: socio.planId
    });
  }

  private buildPayload(): SocioRequest {
    const rawValue = this.form.getRawValue();
    const estado = rawValue.estado ?? 'ACTIVO';

    return {
      nombre: (rawValue.nombre ?? '').trim(),
      apellido: (rawValue.apellido ?? '').trim(),
      dni: (rawValue.dni ?? '').trim(),
      email: (rawValue.email ?? '').trim(),
      telefono: (rawValue.telefono ?? '').trim(),
      fechaNacimiento: this.formatDate(rawValue.fechaNacimiento),
      direccion: (rawValue.direccion ?? '').trim(),
      fechaAlta: this.formatDate(rawValue.fechaAlta),
      estado,
      planId: rawValue.planId
    };
  }

  private formatDate(date: Date | null): string {
    if (!date) {
      return '';
    }

    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = `${localDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${localDate.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo guardar la informacion del socio.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
