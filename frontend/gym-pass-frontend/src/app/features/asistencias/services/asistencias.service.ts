import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';

import { apiBaseUrl } from '../../../core/config/api.config';
import { mapAsistenciaApiResponseToViewModel } from '../mappers/asistencia.mapper';
import {
  AsistenciaApiResponse,
  AsistenciaCreateApiRequest,
  AsistenciaFilters,
  AsistenciaViewModel
} from '../models/asistencia.model';
import { SocioViewModel } from '../../socios/models/socio.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciasService {
  private readonly http = inject(HttpClient);
  private readonly asistenciasUrl = `${apiBaseUrl}/asistencias`;
  private readonly refreshSubject = new Subject<void>();

  readonly refresh$ = this.refreshSubject.asObservable();

  createAsistencia(payload: AsistenciaCreateApiRequest): Observable<AsistenciaApiResponse> {
    return this.http.post<AsistenciaApiResponse>(this.asistenciasUrl, payload);
  }

  registrarSalida(asistenciaId: number): Observable<AsistenciaApiResponse> {
    return this.http.patch<AsistenciaApiResponse>(`${this.asistenciasUrl}/${asistenciaId}/salida`, {});
  }

  getAsistenciaById(id: number, socios?: SocioViewModel[]): Observable<AsistenciaViewModel> {
    return this.http
      .get<AsistenciaApiResponse>(`${this.asistenciasUrl}/${id}`)
      .pipe(map((asistencia) => this.mapWithSocio(asistencia, socios)));
  }

  getAsistenciasHoy(socios?: SocioViewModel[]): Observable<AsistenciaViewModel[]> {
    return this.http
      .get<AsistenciaApiResponse[]>(`${this.asistenciasUrl}/hoy`)
      .pipe(map((asistencias) => asistencias.map((asistencia) => this.mapWithSocio(asistencia, socios))));
  }

  getAsistenciasBySocioId(socioId: number, socios?: SocioViewModel[]): Observable<AsistenciaViewModel[]> {
    return this.http
      .get<AsistenciaApiResponse[]>(`${this.asistenciasUrl}/socio/${socioId}`)
      .pipe(map((asistencias) => asistencias.map((asistencia) => this.mapWithSocio(asistencia, socios))));
  }

  filterAsistencias(asistencias: AsistenciaViewModel[], filters?: AsistenciaFilters): AsistenciaViewModel[] {
    return asistencias.filter((asistencia) => {
      const matchesFecha =
        !filters?.fecha ||
        (asistencia.fechaHoraEntrada?.slice(0, 10) ?? '') === filters.fecha;

      const socioSearch = filters?.socio?.trim().toLowerCase() ?? '';
      const matchesSocio =
        !socioSearch ||
        asistencia.socioNombre.toLowerCase().includes(socioSearch) ||
        (asistencia.socioDni ?? '').toLowerCase().includes(socioSearch);

      const matchesEstado = !filters?.estado || asistencia.estado === filters.estado;

      const generalSearch = filters?.busqueda?.trim().toLowerCase() ?? '';
      const matchesBusqueda =
        !generalSearch ||
        asistencia.socioNombre.toLowerCase().includes(generalSearch) ||
        (asistencia.socioDni ?? '').toLowerCase().includes(generalSearch) ||
        asistencia.id.toString().includes(generalSearch);

      return matchesFecha && matchesSocio && matchesEstado && matchesBusqueda;
    });
  }

  notifyRefresh(): void {
    this.refreshSubject.next();
  }

  private mapWithSocio(
    asistencia: AsistenciaApiResponse,
    socios?: SocioViewModel[]
  ): AsistenciaViewModel {
    const socio = socios?.find((currentSocio) => currentSocio.id === asistencia.socioId);
    return mapAsistenciaApiResponseToViewModel(asistencia, socio);
  }
}
