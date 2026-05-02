import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../../core/services/auth.service';
import { SociosService } from '../../../socios/services/socios.service';
import { MembresiaViewModel } from '../../models/membresia.model';
import { MembresiasService } from '../../services/membresias.service';

@Component({
  selector: 'app-membresia-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './membresia-detail.component.html',
  styleUrl: './membresia-detail.component.css'
})
export class MembresiaDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly membresia = signal<MembresiaViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly actionLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadMembresia();
  }

  protected getEstadoClass(estado: string): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
  }

  protected getSocioEstadoClass(estado: string | null | undefined): string {
    return `socio-estado-chip socio-estado-chip--${(estado ?? 'sin_estado').toLowerCase()}`;
  }

  protected reactivarSocio(): void {
    const membresia = this.membresia();

    if (!membresia?.socioId || membresia.socioEstado !== 'INACTIVO') {
      return;
    }

    if (!window.confirm(`Queres reactivar a ${membresia.socioNombre}?`)) {
      return;
    }

    this.actionLoading.set(true);

    this.sociosService
      .activarSocio(membresia.socioId)
      .pipe(
        finalize(() => this.actionLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updatedSocio) => {
          this.membresia.update((currentMembresia) =>
            currentMembresia
              ? {
                  ...currentMembresia,
                  socioEstado: updatedSocio.estado,
                  socioNombre: updatedSocio.nombreCompleto,
                  socioDni: updatedSocio.dni
                }
              : currentMembresia
          );
          this.snackBar.open('Socio reactivado correctamente.', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(this.resolveErrorMessage(error), 'Cerrar', { duration: 4000 });
        }
      });
  }

  private loadMembresia(): void {
    const membresiaIdParam = this.route.snapshot.paramMap.get('id');
    const membresiaId = membresiaIdParam ? Number(membresiaIdParam) : null;

    if (!Number.isFinite(membresiaId) || membresiaId === null) {
      this.errorMessage.set('El identificador de la membresia no es valido.');
      this.loading.set(false);
      return;
    }

    this.sociosService
      .getSocios()
      .pipe(
        switchMap((socios) => this.membresiasService.getMembresiaById(membresiaId, socios)),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (membresia) => this.membresia.set(membresia),
        error: (error) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo cargar el detalle de la membresia.';
    }

    return 'Ocurrio un error inesperado al cargar el detalle.';
  }
}
