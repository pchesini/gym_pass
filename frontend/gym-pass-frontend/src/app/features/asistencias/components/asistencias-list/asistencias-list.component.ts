import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { SocioViewModel } from '../../../socios/models/socio.model';
import { SociosService } from '../../../socios/services/socios.service';
import { buscarSociosEnFrontend, formatAsistenciaDateTime } from '../../mappers/asistencia.mapper';
import { AsistenciaViewModel, EstadoAsistencia } from '../../models/asistencia.model';
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
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './asistencias-list.component.html',
  styleUrl: './asistencias-list.component.css'
})
export class AsistenciasListComponent {
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly sociosService = inject(SociosService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly estados: EstadoAsistencia[] = ['ABIERTA', 'CERRADA'];
  protected readonly displayedColumns = [
    'id',
    'socio',
    'fechaHoraEntrada',
    'fechaHoraSalida',
    'duracionMinutos',
    'tipoRegistro',
    'estado',
    'acciones'
  ];
  protected readonly socios = signal<SocioViewModel[]>([]);
  protected readonly asistencias = signal<AsistenciaViewModel[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly dataScopeLabel = signal('Asistencias de hoy');
  protected readonly formatFechaHora = formatAsistenciaDateTime;
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
    const socioSearch = (rawValue.socio ?? '').trim();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => {
          this.socios.set(socios);
          return this.resolveAsistenciasSource(socios, socioSearch);
        }),
        map((asistencias) =>
          this.asistenciasService.filterAsistencias(asistencias, {
            fecha: this.formatDate(rawValue.fecha),
            socio: rawValue.socio ?? '',
            estado: rawValue.estado ?? '',
            busqueda: rawValue.busqueda ?? ''
          })
        ),
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

  protected registrarSalida(asistencia: AsistenciaViewModel): void {
    if (asistencia.estado !== 'ABIERTA') {
      return;
    }

    const confirmationText = `Queres registrar la salida de ${asistencia.socioNombre}?`;
    if (!window.confirm(confirmationText)) {
      return;
    }

    this.actionLoadingId.set(asistencia.id);

    this.asistenciasService
      .registrarSalida(asistencia.id)
      .pipe(
        finalize(() => this.actionLoadingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Salida registrada correctamente.', 'Cerrar', { duration: 3000 });
          this.asistenciasService.notifyRefresh();
          this.loadAsistencias();
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4000 });
        }
      });
  }

  protected trackByAsistenciaId(_: number, asistencia: AsistenciaViewModel): number {
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

  private resolveAsistenciasSource(socios: SocioViewModel[], socioSearch: string) {
    if (!socioSearch) {
      this.dataScopeLabel.set('Asistencias de hoy');
      return this.asistenciasService.getAsistenciasHoy(socios);
    }

    const matches = buscarSociosEnFrontend(socios, {
      criterio: 'NOMBRE',
      valor: socioSearch
    }).filter(
      (socio) =>
        socio.nombreCompleto.toLowerCase().includes(socioSearch.toLowerCase()) ||
        socio.dni.includes(socioSearch)
    );

    if (matches.length === 1) {
      this.dataScopeLabel.set(`Historial de ${matches[0].nombreCompleto}`);
      return this.asistenciasService.getAsistenciasBySocioId(matches[0].id, socios);
    }

    this.dataScopeLabel.set('Asistencias de hoy');
    return this.asistenciasService.getAsistenciasHoy(socios);
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
