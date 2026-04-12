import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import {
  Asistencia,
  AsistenciaFilters,
  AsistenciaResponse,
  BuscarSocioRequest,
  RegistroAsistenciaRequest,
  SocioAsistenciaLookup
} from '../models/asistencia.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciasService {
  private readonly http = inject(HttpClient);
  private readonly asistenciasUrl = 'http://localhost:8080/api/v1/asistencias';
  private readonly sociosUrl = 'http://localhost:8080/api/v1/socios';
  private readonly refreshSubject = new Subject<void>();

  readonly refresh$ = this.refreshSubject.asObservable();

  buscarSocio(payload: BuscarSocioRequest): Observable<SocioAsistenciaLookup> {
    const params = new HttpParams()
      .set('criterio', payload.criterio)
      .set('valor', payload.valor.trim());

    return this.http.get<SocioAsistenciaLookup>(`${this.sociosUrl}/busqueda-recepcion`, { params });
  }

  registrarEntrada(socioId: number): Observable<AsistenciaResponse> {
    const payload: RegistroAsistenciaRequest = { socioId };
    return this.http.post<AsistenciaResponse>(`${this.asistenciasUrl}/entrada`, payload);
  }

  registrarSalida(socioId: number): Observable<AsistenciaResponse> {
    const payload: RegistroAsistenciaRequest = { socioId };
    return this.http.post<AsistenciaResponse>(`${this.asistenciasUrl}/salida`, payload);
  }

  getAsistencias(filters?: AsistenciaFilters): Observable<Asistencia[]> {
    let params = new HttpParams();

    if (filters?.fecha) {
      params = params.set('fecha', filters.fecha);
    }

    if (filters?.socio?.trim()) {
      params = params.set('socio', filters.socio.trim());
    }

    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters?.busqueda?.trim()) {
      params = params.set('busqueda', filters.busqueda.trim());
    }

    return this.http.get<Asistencia[]>(this.asistenciasUrl, { params });
  }

  getAsistenciaById(id: number): Observable<Asistencia> {
    return this.http.get<Asistencia>(`${this.asistenciasUrl}/${id}`);
  }

  notifyRefresh(): void {
    this.refreshSubject.next();
  }
}
