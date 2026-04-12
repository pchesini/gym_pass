import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  BuscarSocioRequest,
  CriterioBusquedaSocio,
  SocioAsistenciaLookup
} from '../../models/asistencia.model';
import { AsistenciasService } from '../../services/asistencias.service';

@Component({
  selector: 'app-asistencias-checkin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './asistencias-checkin.component.html',
  styleUrl: './asistencias-checkin.component.css'
})
export class AsistenciasCheckinComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly criterios: { value: CriterioBusquedaSocio; label: string }[] = [
    { value: 'DNI', label: 'DNI' },
    { value: 'NOMBRE', label: 'Nombre' },
    { value: 'APELLIDO', label: 'Apellido' },
    { value: 'CODIGO', label: 'Codigo / QR' }
  ];
  protected readonly loading = signal(false);
  protected readonly actionLoading = signal<'entrada' | 'salida' | null>(null);
  protected readonly socio = signal<SocioAsistenciaLookup | null>(null);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly feedbackTone = signal<'info' | 'warn' | 'error' | 'success'>('info');
  protected readonly statusChipClass = computed(() => {
    const currentSocio = this.socio();
    return currentSocio ? `estado-chip estado-chip--${currentSocio.estado.toLowerCase()}` : '';
  });
  protected readonly form = this.formBuilder.group({
    criterio: ['DNI' as CriterioBusquedaSocio, [Validators.required]],
    valor: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]]
  });

  protected buscarSocio(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: BuscarSocioRequest = {
      criterio: this.form.controls.criterio.value ?? 'DNI',
      valor: (this.form.controls.valor.value ?? '').trim()
    };

    this.loading.set(true);
    this.feedbackMessage.set(null);

    this.asistenciasService
      .buscarSocio(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socio) => {
          this.socio.set(socio);
          this.setFeedbackFromSocio(socio);
        },
        error: (error) => {
          this.socio.set(null);
          this.setFeedback('error', this.resolveErrorMessage(error));
        }
      });
  }

  protected registrarEntrada(): void {
    const currentSocio = this.socio();
    if (!currentSocio) {
      return;
    }

    this.actionLoading.set('entrada');
    this.asistenciasService
      .registrarEntrada(currentSocio.id)
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.setFeedback('success', response.mensaje);
          this.snackBar.open(response.mensaje, 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
          this.buscarSocio();
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.setFeedback('error', message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected registrarSalida(): void {
    const currentSocio = this.socio();
    if (!currentSocio) {
      return;
    }

    this.actionLoading.set('salida');
    this.asistenciasService
      .registrarSalida(currentSocio.id)
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.setFeedback('success', response.mensaje);
          this.snackBar.open(response.mensaje, 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
          this.buscarSocio();
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.setFeedback('error', message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected getErrorMessage(controlName: 'criterio' | 'valor'): string {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('minlength')) {
      return 'Ingresa al menos 2 caracteres.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor supera la longitud maxima permitida.';
    }

    return '';
  }

  private setFeedbackFromSocio(socio: SocioAsistenciaLookup): void {
    if (socio.mensajeRecepcion) {
      const tone = this.resolveToneFromMessage(socio.mensajeRecepcion);
      this.setFeedback(tone, socio.mensajeRecepcion);
      return;
    }

    if (socio.estado !== 'ACTIVO') {
      this.setFeedback('warn', 'El socio esta inactivo y requiere revision antes de ingresar.');
      return;
    }

    if (!socio.tieneMembresia) {
      this.setFeedback('warn', 'El socio no tiene membresia activa.');
      return;
    }

    if (!socio.puedeRegistrarEntrada && !socio.puedeRegistrarSalida) {
      this.setFeedback('warn', 'La asistencia de hoy ya fue cerrada.');
      return;
    }

    this.setFeedback('success', 'Socio habilitado para registrar asistencia.');
  }

  private resolveToneFromMessage(message: string): 'info' | 'warn' | 'error' | 'success' {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('vencida') ||
      normalizedMessage.includes('inactivo') ||
      normalizedMessage.includes('no tiene')
    ) {
      return 'warn';
    }

    if (normalizedMessage.includes('error')) {
      return 'error';
    }

    return 'info';
  }

  private setFeedback(
    tone: 'info' | 'warn' | 'error' | 'success',
    message: string | null
  ): void {
    this.feedbackTone.set(tone);
    this.feedbackMessage.set(message);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo completar la operacion de asistencia.';
    }

    return 'Ocurrio un error inesperado al procesar la asistencia.';
  }
}
