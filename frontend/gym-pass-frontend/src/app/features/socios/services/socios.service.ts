import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  EstadoSocio,
  EstadoSocioUpdateRequest,
  PlanSocio,
  Socio,
  SocioFilters,
  SocioRequest
} from '../models/socio.model';

@Injectable({
  providedIn: 'root'
})
export class SociosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/socios';
  private readonly planesUrl = 'http://localhost:8080/api/v1/planes';

  getSocios(filters?: SocioFilters): Observable<Socio[]> {
    let params = new HttpParams();

    if (filters?.busqueda?.trim()) {
      params = params.set('busqueda', filters.busqueda.trim());
    }

    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<Socio[]>(this.apiUrl, { params });
  }

  getSocioById(id: number): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl}/${id}`);
  }

  createSocio(payload: SocioRequest): Observable<Socio> {
    return this.http.post<Socio>(this.apiUrl, payload);
  }

  updateSocio(id: number, payload: SocioRequest): Observable<Socio> {
    return this.http.put<Socio>(`${this.apiUrl}/${id}`, payload);
  }

  updateEstado(id: number, estado: EstadoSocio): Observable<Socio> {
    const payload: EstadoSocioUpdateRequest = { estado };

    return this.http.patch<Socio>(`${this.apiUrl}/${id}/estado`, payload);
  }

  activarSocio(id: number): Observable<Socio> {
    return this.updateEstado(id, 'ACTIVO');
  }

  desactivarSocio(id: number): Observable<Socio> {
    return this.updateEstado(id, 'INACTIVO');
  }

  getPlanes(): Observable<PlanSocio[]> {
    return this.http.get<PlanSocio[]>(this.planesUrl);
  }
}
