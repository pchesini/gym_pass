import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { EstadoMembresia, Membresia } from '../../models/membresia.model';
import { MembresiasService } from '../../services/membresias.service';

@Component({
  selector: 'app-membresias-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './membresias-list.component.html',
  styleUrl: './membresias-list.component.css'
})
export class MembresiasListComponent {
  private readonly membresiasService = inject(MembresiasService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = [
    'id',
    'nombre',
    'descripcion',
    'duracionDias',
    'precio',
    'estado',
    'acciones'
  ];
  protected readonly membresias = signal<Membresia[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadMembresias();
  }

  protected loadMembresias(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.membresiasService
      .getMembresias()
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
  }

  protected navigateToEdit(id: number): void {
    void this.router.navigate(['/membresias', id, 'editar']);
  }

  protected navigateToDetail(id: number): void {
    void this.router.navigate(['/membresias', id]);
  }

  protected toggleEstado(membresia: Membresia): void {
    const nextEstado: EstadoMembresia = membresia.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    const confirmationText =
      nextEstado === 'ACTIVA'
        ? `Queres activar la membresia ${membresia.nombre}?`
        : `Queres desactivar la membresia ${membresia.nombre}?`;

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
          this.membresias.update((currentMembresias) =>
            currentMembresias.map((currentMembresia) =>
              currentMembresia.id === updatedMembresia.id ? updatedMembresia : currentMembresia
            )
          );

          this.snackBar.open(
            `Estado actualizado a ${updatedMembresia.estado.toLowerCase()}.`,
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected trackByMembresiaId(_: number, membresia: Membresia): number {
    return membresia.id;
  }

  protected getEstadoChipClass(estado: EstadoMembresia): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar la informacion de membresias.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
