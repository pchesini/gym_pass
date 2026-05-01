import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { apiBaseUrl } from '../config/api.config';
import { AuthSession, LoginRequest, LoginResponse, RolUsuario } from '../models/auth.model';

const AUTH_STORAGE_KEY = 'gym-pass-auth-session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AuthSession | null>(this.readSession());

  readonly currentSession = this.session.asReadonly();
  readonly isAuthenticated = computed(() => !!this.session()?.token);
  readonly currentRole = computed(() => this.session()?.rol ?? null);
  readonly isAdmin = computed(() => this.currentRole() === 'ADMIN');

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${apiBaseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        const session: AuthSession = {
          token: response.token,
          username: response.username,
          rol: response.rol
        };
        this.setSession(session);
      })
    );
  }

  logout(): void {
    this.session.set(null);
    this.removeStoredSession();
  }

  hasAnyRole(roles: RolUsuario[]): boolean {
    const currentRole = this.currentRole();
    return currentRole !== null && roles.includes(currentRole);
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  getDefaultRoute(): string {
    return this.isAdmin() ? '/dashboard' : '/socios';
  }

  private setSession(session: AuthSession): void {
    this.session.set(session);

    if (!this.canUseStorage()) {
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  private readSession(): AuthSession | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as AuthSession;

      if (!parsedSession.token || !parsedSession.username || !parsedSession.rol) {
        return null;
      }

      return parsedSession;
    } catch {
      return null;
    }
  }

  private removeStoredSession(): void {
    if (this.canUseStorage()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private canUseStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
