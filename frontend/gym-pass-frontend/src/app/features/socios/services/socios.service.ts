import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiBaseUrl } from '../../../core/config/api.config';
import { mapSocioApiResponseToViewModel } from '../mappers/socio.mapper';
import {
  EstadoSocio,
  EstadoSocioUpdateRequest,
  SocioApiResponse,
  SocioCreateApiRequest,
  SocioFilters,
  SocioQrApiResponse,
  SocioUpdateApiRequest,
  SocioViewModel
} from '../models/socio.model';

@Injectable({
  providedIn: 'root'
})
export class SociosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${apiBaseUrl}/socios`;

  getSocios(filters?: SocioFilters): Observable<SocioViewModel[]> {
    let params = new HttpParams();

    if (filters?.busqueda?.trim()) {
      params = params.set('busqueda', filters.busqueda.trim());
    }

    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }

    return this.http
      .get<SocioApiResponse[]>(this.apiUrl, { params })
      .pipe(map((socios) => socios.map(mapSocioApiResponseToViewModel)));
  }

  getSocioById(id: number): Observable<SocioViewModel> {
    return this.http
      .get<SocioApiResponse>(`${this.apiUrl}/${id}`)
      .pipe(map(mapSocioApiResponseToViewModel));
  }

  createSocio(payload: SocioCreateApiRequest): Observable<SocioViewModel> {
    return this.http
      .post<SocioApiResponse>(this.apiUrl, payload)
      .pipe(map(mapSocioApiResponseToViewModel));
  }

  updateSocio(id: number, payload: SocioUpdateApiRequest): Observable<SocioViewModel> {
    return this.http
      .put<SocioApiResponse>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(mapSocioApiResponseToViewModel));
  }

  updateEstado(id: number, estado: EstadoSocio): Observable<SocioViewModel> {
    const payload: EstadoSocioUpdateRequest = { estado };

    return this.http
      .patch<SocioApiResponse>(`${this.apiUrl}/${id}/estado`, payload)
      .pipe(map(mapSocioApiResponseToViewModel));
  }

  activarSocio(id: number): Observable<SocioViewModel> {
    return this.updateEstado(id, 'ACTIVO');
  }

  desactivarSocio(id: number): Observable<SocioViewModel> {
    return this.updateEstado(id, 'INACTIVO');
  }

  getQr(id: number): Observable<SocioQrApiResponse> {
    return this.http.get<SocioQrApiResponse>(`${this.apiUrl}/${id}/qr`);
  }
}
