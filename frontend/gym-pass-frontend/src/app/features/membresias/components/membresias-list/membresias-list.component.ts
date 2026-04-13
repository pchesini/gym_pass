import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { SocioViewModel } from '../../../socios/models/socio.model';
import { SociosService } from '../../../socios/services/socios.service';
import { EstadoMembresia, MembresiaViewModel } from '../../models/membresia.model';
import { MembresiasService } from '../../services/membresias.service';

@Component({
  selector: 'app-membresias-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './membresias-list.component.html',
  styleUrl: './membresias-list.component.css'
})
export class MembresiasListComponent {
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = [
    'id',
    'fechaInicio',
    'fechaVencimiento',
    'precioLista',
    'saldoPendiente',
    'estado',
    'acciones'
  ];
  protected readonly estados: EstadoMembresia[] = [
    'ACTIVA',
    'VENCIDA',
    'CANCELADA',
    'PENDIENTE_PAGO'
  ];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly resultados = signal<SocioViewModel[]>([]);
  protected readonly selectedSocio = signal<SocioViewModel | null>(null);
  protected readonly activeMembresia = signal<MembresiaViewModel | null>(null);
  protected readonly membresias = signal<MembresiaViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.formBuilder.group({
    criterio: ['DNI' as 'DNI' | 'NOMBRE' | 'APELLIDO', [Validators.required]],
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

    const criterio = this.form.controls.criterio.value ?? 'DNI';
    const valor = (this.form.controls.valor.value ?? '').trim().toLowerCase();
    const resultados = this.socios().filter((socio) => {
      switch (criterio) {
        case 'DNI':
          return socio.dni.toLowerCase().includes(valor);
        case 'APELLIDO':
          return socio.apellido.toLowerCase().includes(valor);
        default:
          return (
            socio.nombre.toLowerCase().includes(valor) ||
            socio.nombreCompleto.toLowerCase().includes(valor)
          );
      }
    });

    this.resultados.set(resultados);
    this.selectedSocio.set(null);
    this.activeMembresia.set(null);
    this.membresias.set([]);

    if (!resultados.length) {
      this.errorMessage.set('No se encontro ningun socio con ese criterio.');
      return;
    }

    this.errorMessage.set(null);

    if (resultados.length === 1) {
      this.selectSocio(resultados[0]);
    }
  }

  protected selectSocio(socio: SocioViewModel): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.selectedSocio.set(socio);
    this.resultados.set([]);

    this.membresiasService
      .getMembresiasBySocioId(socio.id, this.socios())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (membresias) => this.membresias.set(membresias),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.membresias.set([]);
        }
      });

    this.membresiasService
      .getMembresiaActivaBySocioId(socio.id, this.socios())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (membresia) => this.activeMembresia.set(membresia),
        error: () => this.activeMembresia.set(null)
      });
  }

  protected navigateToEdit(id: number): void {
    void this.router.navigate(['/membresias', id, 'editar']);
  }

  protected navigateToDetail(id: number): void {
    void this.router.navigate(['/membresias', id]);
  }

  protected createForSelectedSocio(): void {
    const socio = this.selectedSocio();
    void this.router.navigate(['/membresias/nueva'], {
      queryParams: socio ? { socioId: socio.id } : undefined
    });
  }

  protected toggleEstado(membresia: MembresiaViewModel): void {
    const nextEstado: EstadoMembresia =
      membresia.estado === 'ACTIVA' ? 'CANCELADA' : 'ACTIVA';
    const confirmationText =
      nextEstado === 'ACTIVA'
        ? `Queres activar la membresia #${membresia.id} de ${membresia.socioNombre}?`
        : `Queres cancelar la membresia #${membresia.id} de ${membresia.socioNombre}?`;

    if (!window.confirm(confirmationText)) {
      return;
    }

    this.actionLoadingId.set(membresia.id);

    this.membresiasService
      .updateEstado(membresia.id, nextEstado)
      .pipe(
        finalize(() => this.actionLoadingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedMembresia) => {
          const socio = this.socios().find((currentSocio) => currentSocio.id === updatedMembresia.socioId);
          const updatedViewModel: MembresiaViewModel = {
            id: updatedMembresia.id,
            socioId: updatedMembresia.socioId,
            socioNombre: socio?.nombreCompleto ?? `Socio #${updatedMembresia.socioId ?? 'N/D'}`,
            socioDni: socio?.dni ?? null,
            fechaInicio: updatedMembresia.fechaInicio,
            fechaVencimiento: updatedMembresia.fechaVencimiento,
            estado: updatedMembresia.estado,
            precioLista: updatedMembresia.precioLista,
            saldoPendiente: updatedMembresia.saldoPendiente,
            activa: updatedMembresia.estado === 'ACTIVA'
          };

          this.membresias.update((currentMembresias) =>
            currentMembresias.map((currentMembresia) =>
              currentMembresia.id === updatedViewModel.id ? updatedViewModel : currentMembresia
            )
          );
          if (updatedViewModel.activa) {
            this.activeMembresia.set(updatedViewModel);
          } else if (this.activeMembresia()?.id === updatedViewModel.id) {
            this.activeMembresia.set(null);
          }

          this.snackBar.open(
            `Estado actualizado a ${updatedViewModel.estado.toLowerCase()}.`,
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected trackByMembresiaId(_: number, membresia: MembresiaViewModel): number {
    return membresia.id;
  }

  protected getEstadoChipClass(estado: EstadoMembresia): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
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

  private loadSocios(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.sociosService
      .getSocios()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socios) => this.socios.set(socios),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.socios.set([]);
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar la informacion de membresias.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
