import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
  AsistenciaAccesoBloqueadoResponse,
  CriterioBusquedaSocio,
  BuscarSocioRequest,
  SocioAsistenciaLookup
} from '../../models/asistencia.model';
import {
  buildSocioAsistenciaLookup,
  buscarSociosEnFrontend,
  formatAsistenciaDateTime,
  mapAsistenciaFormToCreateRequest
} from '../../mappers/asistencia.mapper';
import { AsistenciasService } from '../../services/asistencias.service';
import { MembresiasService } from '../../../membresias/services/membresias.service';
import { SociosService } from '../../../socios/services/socios.service';
import { SocioViewModel } from '../../../socios/models/socio.model';

@Component({
  selector: 'app-asistencias-checkin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
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
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly criterios: { value: CriterioBusquedaSocio; label: string }[] = [
    { value: 'DNI', label: 'DNI' },
    { value: 'NOMBRE', label: 'Nombre' },
    { value: 'APELLIDO', label: 'Apellido' },
    { value: 'CODIGO', label: 'Codigo / referencia' }
  ];
  protected readonly loading = signal(false);
  protected readonly actionLoading = signal<'entrada' | 'salida' | 'reactivar' | null>(null);
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly resultados = signal<SocioViewModel[]>([]);
  protected readonly socio = signal<SocioAsistenciaLookup | null>(null);
  protected readonly accesoBloqueado = signal<AsistenciaAccesoBloqueadoResponse | null>(null);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly feedbackTone = signal<'info' | 'warn' | 'error' | 'success'>('info');
  protected readonly statusChipClass = computed(() => {
    const currentSocio = this.socio();
    return currentSocio ? `estado-chip estado-chip--${currentSocio.socio.estado.toLowerCase()}` : '';
  });
  protected readonly formatFechaHora = formatAsistenciaDateTime;
  protected readonly form = this.formBuilder.group({
    criterio: ['NOMBRE' as CriterioBusquedaSocio, [Validators.required]],
    valor: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]]
  });

  constructor() {
    this.loadSocios();
  }

  protected buscarSocio(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: BuscarSocioRequest = {
      criterio: this.form.controls.criterio.value ?? 'NOMBRE',
      valor: (this.form.controls.valor.value ?? '').trim()
    };

    this.loading.set(true);
    this.feedbackMessage.set(null);
    this.accesoBloqueado.set(null);
    this.socio.set(null);

    const resultados = buscarSociosEnFrontend(this.socios(), payload);
    this.resultados.set(resultados);

    if (!resultados.length) {
      this.loading.set(false);
      this.setFeedback('warn', 'No se encontro ningun socio con ese criterio.');
      return;
    }

    if (resultados.length === 1) {
      this.selectSocio(resultados[0]);
      return;
    }

    this.loading.set(false);
    this.setFeedback('info', 'Se encontraron varios socios. Selecciona uno para continuar.');
  }

  protected selectSocio(socio: SocioViewModel): void {
    this.loading.set(true);
    this.resultados.set([]);
    this.accesoBloqueado.set(null);

    this.asistenciasService
      .getAsistenciasBySocioId(socio.id, this.socios())
      .subscribe({
        next: (asistencias) => {
          forkJoin({
            membresias: this.membresiasService.getMembresiasBySocioId(socio.id, this.socios())
          })
            .pipe(
              finalize(() => this.loading.set(false)),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: ({ membresias }) => {
                const lookup = buildSocioAsistenciaLookup(socio, asistencias, membresias);
                this.socio.set(lookup);
                this.setFeedbackFromSocio(lookup);
              },
              error: (error) => {
                this.socio.set(null);
                this.setFeedback('error', this.resolveErrorMessage(error));
              }
            });
        },
        error: (error) => {
          this.loading.set(false);
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
    const payload = mapAsistenciaFormToCreateRequest(currentSocio.socio.id, currentSocio.socio.id);

    this.asistenciasService
      .createAsistencia(payload)
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const message = 'Entrada registrada correctamente.';
          this.setFeedback('success', message);
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
          this.selectSocio(currentSocio.socio);
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.accesoBloqueado.set(this.resolveAccesoBloqueado(error));
          this.setFeedback('error', message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected registrarSalida(): void {
    const currentSocio = this.socio();
    const asistenciaAbierta = currentSocio?.asistenciaAbierta;

    if (!currentSocio || !asistenciaAbierta) {
      return;
    }

    this.actionLoading.set('salida');
    this.asistenciasService
      .registrarSalida(asistenciaAbierta.id)
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const message = 'Salida registrada correctamente.';
          this.setFeedback('success', message);
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
          this.selectSocio(currentSocio.socio);
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.setFeedback('error', message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected reactivarSocioActual(): void {
    const currentSocio = this.socio();

    if (!currentSocio || currentSocio.socio.estado !== 'INACTIVO') {
      return;
    }

    if (!window.confirm(`Queres reactivar a ${currentSocio.socio.nombreCompleto}?`)) {
      return;
    }

    this.actionLoading.set('reactivar');

    this.sociosService
      .activarSocio(currentSocio.socio.id)
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedSocio) => {
          this.socios.update((currentSocios) =>
            currentSocios.map((socio) => (socio.id === updatedSocio.id ? updatedSocio : socio))
          );
          this.snackBar.open('Socio reactivado correctamente.', 'Cerrar', { duration: 3000 });
          this.selectSocio(updatedSocio);
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

  protected trackBySocioId(_: number, socio: SocioViewModel): number {
    return socio.id;
  }

  protected registrarPagoBloqueo(): void {
    const bloqueo = this.accesoBloqueado();

    if (!bloqueo?.socioId || !bloqueo?.membresiaId) {
      return;
    }

    this.navegarARegistroPago(
      bloqueo.socioId,
      bloqueo.membresiaId,
      bloqueo.saldoPendiente
    );
  }

  protected registrarPagoSocio(): void {
    const currentSocio = this.socio();

    if (!currentSocio?.membresiaId) {
      return;
    }

    this.navegarARegistroPago(
      currentSocio.socio.id,
      currentSocio.membresiaId,
      currentSocio.saldoPendienteMembresia
    );
  }

  protected crearMembresiaSocio(): void {
    const currentSocio = this.socio();

    if (!currentSocio) {
      return;
    }

    void this.router.navigate(['/membresias/nueva'], {
      queryParams: {
        socioId: currentSocio.socio.id
      }
    });
  }

  protected shouldShowCrearMembresia(
    currentSocio: SocioAsistenciaLookup
  ): boolean {
    return currentSocio.socio.estado === 'ACTIVO'
      && currentSocio.membresiaId === null
      && currentSocio.estadoMembresia === null;
  }

  private navegarARegistroPago(
    socioId: number,
    membresiaId: number,
    monto: number | null | undefined
  ): void {
    const queryParams: { socioId: number; membresiaId: number; monto?: number } = {
      socioId,
      membresiaId
    };

    if (monto !== null && monto !== undefined && monto > 0) {
      queryParams.monto = monto;
    }

    void this.router.navigate(['/pagos/nuevo'], {
      queryParams
    });
  }

  private loadSocios(): void {
    this.loading.set(true);

    this.sociosService
      .getSocios()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socios) => this.socios.set(socios),
        error: (error) => {
          this.setFeedback('error', this.resolveErrorMessage(error));
        }
      });
  }

  private setFeedbackFromSocio(lookup: SocioAsistenciaLookup): void {
    if (lookup.mensajeRecepcion) {
      const tone = this.resolveToneFromMessage(lookup.mensajeRecepcion);
      this.setFeedback(tone, lookup.mensajeRecepcion);
      return;
    }

    if (lookup.socio.estado !== 'ACTIVO') {
      this.setFeedback('warn', 'El socio esta inactivo y requiere revision antes de ingresar.');
      return;
    }

    this.setFeedback('success', 'Socio habilitado para registrar asistencia.');
  }

  private resolveToneFromMessage(message: string): 'info' | 'warn' | 'error' | 'success' {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes('inactivo') ||
      normalizedMessage.includes('no tiene') ||
      normalizedMessage.includes('abierta')
    ) {
      return 'warn';
    }

    if (normalizedMessage.includes('saldo pendiente')) {
      return 'info';
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

  private resolveAccesoBloqueado(error: unknown): AsistenciaAccesoBloqueadoResponse | null {
    if (!(error instanceof HttpErrorResponse) || !error.error) {
      return null;
    }

    const response = error.error as Partial<AsistenciaAccesoBloqueadoResponse>;

    if (!('membresiaVencida' in response) && !('tieneSaldoPendiente' in response)) {
      return null;
    }

    return {
      message: response.message ?? 'No se puede registrar asistencia.',
      socioId: response.socioId ?? null,
      socioNombre: response.socioNombre ?? null,
      membresiaId: response.membresiaId ?? null,
      estadoMembresia: response.estadoMembresia ?? null,
      fechaVencimiento: response.fechaVencimiento ?? null,
      saldoPendiente: response.saldoPendiente ?? null,
      membresiaVencida: !!response.membresiaVencida,
      tieneSaldoPendiente: !!response.tieneSaldoPendiente
    };
  }
}
