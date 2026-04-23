import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AsistenciaQrApiResponse } from '../../models/asistencia.model';
import { AsistenciasService } from '../../services/asistencias.service';

type Html5QrcodeInstance = {
  start(
    cameraConfig: { facingMode: string },
    configuration: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError?: (errorMessage: string) => void
  ): Promise<unknown>;
  stop(): Promise<unknown>;
  clear(): void;
};

type Html5QrcodeModule = {
  Html5Qrcode: new (elementId: string, verbose?: boolean) => Html5QrcodeInstance;
};

@Component({
  selector: 'app-asistencias-scanner-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './asistencias-scanner-page.component.html',
  styleUrl: './asistencias-scanner-page.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AsistenciasScannerPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private html5QrCode: Html5QrcodeInstance | null = null;
  private isProcessingScan = false;
  private lastScannedValue: string | null = null;
  private lastScannedAt = 0;

  protected readonly loading = signal(false);
  protected readonly response = signal<AsistenciaQrApiResponse | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly cameraReady = signal(false);
  protected readonly cameraLoading = signal(false);
  protected readonly cameraActive = signal(false);
  protected readonly cameraSupported = signal(this.hasCameraSupport());
  protected readonly form = this.formBuilder.group({
    qrCode: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]]
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.stopCamera();
    });
  }

  protected registrarPorQr(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const qrCode = this.normalizeQrValue(this.form.controls.qrCode.value ?? '');
    this.loading.set(true);
    this.errorMessage.set(null);
    this.response.set(null);

    this.asistenciasService
      .registrarEntradaPorQr({ qrCode })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.isProcessingScan = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.response.set(response);
          this.form.patchValue({ qrCode: response.qrCode });
          this.snackBar.open(response.mensaje, 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.errorMessage.set(message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected async toggleCamera(): Promise<void> {
    if (this.cameraActive()) {
      await this.stopCamera();
      return;
    }

    if (!this.cameraSupported()) {
      this.errorMessage.set(
        'Este navegador no permite usar la camara para escanear. Puedes seguir usando el ingreso manual del QR.'
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.errorMessage.set(
        'No fue posible acceder a la camara del dispositivo. Revisa permisos o usa HTTPS en el celular.'
      );
      return;
    }

    this.cameraLoading.set(true);
    this.errorMessage.set(null);

    try {
      const qrModule = (await import('html5-qrcode')) as Html5QrcodeModule;
      const html5QrCode = new qrModule.Html5Qrcode('qr-reader', false);
      this.html5QrCode = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 }
        },
        (decodedText: string) => {
          void this.handleScanSuccess(decodedText);
        }
      );

      this.cameraReady.set(true);
      this.cameraActive.set(true);
    } catch (error) {
      await this.stopCamera();
      this.errorMessage.set(this.resolveCameraErrorMessage(error));
    } finally {
      this.cameraLoading.set(false);
    }
  }

  protected limpiar(): void {
    this.form.reset({ qrCode: '' });
    this.response.set(null);
    this.errorMessage.set(null);
  }

  protected getQrErrorMessage(): string {
    const control = this.form.controls.qrCode;

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Ingresa o pega el codigo QR del socio.';
    }

    if (control.hasError('minlength')) {
      return 'El codigo QR es demasiado corto.';
    }

    if (control.hasError('maxlength')) {
      return 'El codigo QR supera la longitud maxima permitida.';
    }

    return '';
  }

  private async handleScanSuccess(decodedText: string): Promise<void> {
    if (this.isProcessingScan) {
      return;
    }

    const normalizedValue = this.normalizeQrValue(decodedText);
    const now = Date.now();
    const isRepeatedRead =
      normalizedValue === this.lastScannedValue && now - this.lastScannedAt < 3000;

    if (isRepeatedRead) {
      return;
    }

    this.lastScannedValue = normalizedValue;
    this.lastScannedAt = now;
    this.form.patchValue({ qrCode: normalizedValue });
    this.isProcessingScan = true;
    this.registrarPorQr();
  }

  private async stopCamera(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
      } catch {
        // Ignoramos errores al detener si la camara ya estaba cerrada.
      }

      try {
        this.html5QrCode.clear();
      } catch {
        // Ignoramos errores de limpieza del contenedor.
      }
    }

    this.html5QrCode = null;
    this.cameraActive.set(false);
    this.cameraLoading.set(false);
    this.cameraReady.set(false);
  }

  private hasCameraSupport(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  private normalizeQrValue(rawQrValue: string): string {
    const normalizedValue = rawQrValue.trim().toUpperCase();
    const matches = normalizedValue.match(/S-[A-Z0-9]+/);
    return matches?.[0] ?? normalizedValue;
  }

  private resolveCameraErrorMessage(error: unknown): string {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return 'La camara fue bloqueada. Habilita el permiso del navegador para usar el escaner.';
      }

      if (error.name === 'NotFoundError') {
        return 'No se encontro una camara disponible en este dispositivo.';
      }
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (message.toLowerCase().includes('secure')) {
        return 'La camara requiere un contexto seguro. En celular suele funcionar mejor con HTTPS.';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo iniciar la camara. Puedes seguir usando el ingreso manual del QR.';
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo registrar la asistencia por QR.';
    }

    return 'Ocurrio un error inesperado al registrar la asistencia.';
  }
}
