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
    MatProgressSpinnerModule
  ],
  templateUrl: './membresia-detail.component.html',
  styleUrl: './membresia-detail.component.css'
})
export class MembresiaDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly membresiasService = inject(MembresiasService);
  private readonly sociosService = inject(SociosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly membresia = signal<MembresiaViewModel | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadMembresia();
  }

  protected getEstadoClass(estado: string): string {
    return `estado-chip estado-chip--${estado.toLowerCase()}`;
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
