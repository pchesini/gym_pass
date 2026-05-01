import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly form = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, password } = this.form.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService
      .login({
        username: username ?? '',
        password: password ?? ''
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(returnUrl || this.authService.getDefaultRoute());
        },
        error: (error) => this.errorMessage.set(this.resolveErrorMessage(error))
      });
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((currentValue) => !currentValue);
  }

  protected getErrorMessage(controlName: 'username' | 'password'): string {
    const control = this.form.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    return '';
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Usuario o contraseña incorrectos.';
    }

    return 'No se pudo iniciar sesion. Revisa que el backend este levantado.';
  }
}
