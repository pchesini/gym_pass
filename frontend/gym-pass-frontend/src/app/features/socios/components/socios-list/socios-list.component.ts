import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
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
import { MatTableModule } from '@angular/material/table';

import { EstadoSocio, SocioViewModel } from '../../models/socio.model';
import { SociosService } from '../../services/socios.service';

@Component({
  selector: 'app-socios-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
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
  templateUrl: './socios-list.component.html',
  styleUrl: './socios-list.component.css'
})
export class SociosListComponent {
  private readonly sociosService = inject(SociosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly displayedColumns = [
    'id',
    'nombre',
    'apellido',
    'dni',
    'email',
    'telefono',
    'estado',
    'fechaNacimiento',
    'acciones'
  ];
  protected readonly estados: EstadoSocio[] = ['ACTIVO', 'INACTIVO'];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly estadoControl = new FormControl<EstadoSocio | ''>('', { nonNullable: true });

  constructor() {
    this.observeFilters();
    this.loadSocios();
  }

  protected loadSocios(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.sociosService
      .getSocios({
        busqueda: this.searchControl.value,
        estado: this.estadoControl.value
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socios) => this.socios.set(socios),
        error: (error) => this.handleLoadError(error)
      });
  }

  protected clearFilters(): void {
    this.searchControl.setValue('');
    this.estadoControl.setValue('');
    this.loadSocios();
  }

  protected navigateToDetail(id: number): void {
    void this.router.navigate(['/socios', id]);
  }

  protected navigateToEdit(id: number): void {
    void this.router.navigate(['/socios', id, 'editar']);
  }

  protected toggleEstado(socio: SocioViewModel): void {
    const nextEstado: EstadoSocio = socio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirmationText =
      nextEstado === 'ACTIVO'
        ? `Queres activar a ${socio.nombre} ${socio.apellido}?`
        : `Queres desactivar a ${socio.nombre} ${socio.apellido}?`;

    if (!window.confirm(confirmationText)) {
      return;
    }

    this.actionLoadingId.set(socio.id);

    this.sociosService
      .updateEstado(socio.id, nextEstado)
      .pipe(
        finalize(() => this.actionLoadingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedSocio) => {
          this.socios.update((currentSocios) =>
            currentSocios.map((currentSocio) =>
              currentSocio.id === updatedSocio.id ? updatedSocio : currentSocio
            )
          );

          this.snackBar.open(
            `Estado actualizado a ${updatedSocio.estado.toLowerCase()}.`,
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', {
            duration: 4000
          });
        }
      });
  }

  protected trackBySocioId(_: number, socio: SocioViewModel): number {
    return socio.id;
  }

  protected getEstadoChipClass(estado: EstadoSocio): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
  }

  private observeFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadSocios());

    this.estadoControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadSocios();
    });
  }

  private handleLoadError(error: unknown): void {
    this.errorMessage.set(this.resolveErrorMessage(error));
    this.socios.set([]);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo conectar con la API de socios.';
    }

    return 'Ocurrio un error inesperado al procesar la solicitud.';
  }
}
