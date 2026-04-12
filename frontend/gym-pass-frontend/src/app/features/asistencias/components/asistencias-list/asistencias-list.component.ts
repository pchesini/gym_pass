import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { Asistencia, EstadoAsistencia } from '../../models/asistencia.model';
import { AsistenciasService } from '../../services/asistencias.service';

@Component({
  selector: 'app-asistencias-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './asistencias-list.component.html',
  styleUrl: './asistencias-list.component.css'
})
export class AsistenciasListComponent {
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly estados: EstadoAsistencia[] = ['EN_CURSO', 'FINALIZADA', 'OBSERVADA'];
  protected readonly displayedColumns = [
    'id',
    'socio',
    'fecha',
    'horaEntrada',
    'horaSalida',
    'estado',
    'acciones'
  ];
  protected readonly asistencias = signal<Asistencia[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly filtersForm = this.formBuilder.group({
    fecha: [null as Date | null],
    socio: [''],
    estado: ['' as EstadoAsistencia | ''],
    busqueda: ['']
  });

  constructor() {
    this.observeFilters();
    this.observeRefresh();
    this.loadAsistencias();
  }

  protected loadAsistencias(): void {
    const rawValue = this.filtersForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.asistenciasService
      .getAsistencias({
        fecha: this.formatDate(rawValue.fecha),
        socio: rawValue.socio ?? '',
        estado: rawValue.estado ?? '',
        busqueda: rawValue.busqueda ?? ''
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (asistencias) => this.asistencias.set(asistencias),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.asistencias.set([]);
        }
      });
  }

  protected clearFilters(): void {
    this.filtersForm.patchValue({
      fecha: null,
      socio: '',
      estado: '',
      busqueda: ''
    });
    this.loadAsistencias();
  }

  protected goToDetail(asistenciaId: number): void {
    void this.router.navigate(['/asistencias', asistenciaId]);
  }

  protected trackByAsistenciaId(_: number, asistencia: Asistencia): number {
    return asistencia.id;
  }

  protected getEstadoClass(estado: EstadoAsistencia): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
  }

  private observeFilters(): void {
    this.filtersForm.controls.busqueda.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAsistencias());

    this.filtersForm.controls.socio.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAsistencias());

    this.filtersForm.controls.fecha.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAsistencias());

    this.filtersForm.controls.estado.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAsistencias());
  }

  private observeRefresh(): void {
    this.asistenciasService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAsistencias());
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el historial de asistencias.';
    }

    return 'Ocurrio un error inesperado al consultar el historial.';
  }
}
