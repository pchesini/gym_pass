import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SocioViewModel } from '../../models/socio.model';
import { SociosService } from '../../services/socios.service';

@Component({
  selector: 'app-socio-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './socio-detail.component.html',
  styleUrl: './socio-detail.component.css'
})
export class SocioDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sociosService = inject(SociosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly socio = signal<SocioViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly estadoChipClass = computed(() => {
    const currentSocio = this.socio();
    return currentSocio ? `estado-chip estado-chip--${currentSocio.estado.toLowerCase()}` : '';
  });

  constructor() {
    this.loadSocio();
  }

  private loadSocio(): void {
    const socioIdParam = this.route.snapshot.paramMap.get('id');
    const socioId = socioIdParam ? Number(socioIdParam) : null;

    if (!Number.isFinite(socioId) || socioId === null) {
      this.errorMessage.set('El identificador del socio no es valido.');
      this.loading.set(false);
      return;
    }

    this.sociosService
      .getSocioById(socioId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (socio) => this.socio.set(socio),
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.errorMessage.set(message);
          this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? 'No se pudo obtener el detalle del socio.';
    }

    return 'Ocurrio un error inesperado al cargar el detalle.';
  }
}
