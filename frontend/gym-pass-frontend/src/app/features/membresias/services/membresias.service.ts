import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  EstadoMembresia,
  MembresiaAltaConPagoApiRequest,
  MembresiaApiResponse,
  MembresiaCreateApiRequest,
  MembresiaEstadoUpdateRequest,
  MembresiaUpdateApiRequest,
  MembresiaViewModel
} from '../models/membresia.model';
import { apiBaseUrl } from '../../../core/config/api.config';
import { mapMembresiaApiResponseToViewModel } from '../mappers/membresia.mapper';
import { SocioViewModel } from '../../socios/models/socio.model';

@Injectable({
  providedIn: 'root'
})
export class MembresiasService {
  private readonly http = inject(HttpClient);
  private readonly membresiasUrl = `${apiBaseUrl}/membresias`;

  getMembresias(socios?: SocioViewModel[]): Observable<MembresiaViewModel[]> {
    return this.http
      .get<MembresiaApiResponse[]>(this.membresiasUrl)
      .pipe(
        map((membresias) => membresias.map((membresia) => this.mapWithSocio(membresia, socios)))
      );
  }

  getMembresiaById(id: number, socios?: SocioViewModel[]): Observable<MembresiaViewModel> {
    return this.http
      .get<MembresiaApiResponse>(`${this.membresiasUrl}/${id}`)
      .pipe(map((membresia) => this.mapWithSocio(membresia, socios)));
  }

  getMembresiasBySocioId(
    socioId: number,
    socios?: SocioViewModel[]
  ): Observable<MembresiaViewModel[]> {
    return this.http
      .get<MembresiaApiResponse[]>(`${this.membresiasUrl}/socio/${socioId}`)
      .pipe(
        map((membresias) => membresias.map((membresia) => this.mapWithSocio(membresia, socios)))
      );
  }

  getMembresiaActivaBySocioId(
    socioId: number,
    socios?: SocioViewModel[]
  ): Observable<MembresiaViewModel> {
    return this.http
      .get<MembresiaApiResponse>(`${this.membresiasUrl}/socio/${socioId}/activa`)
      .pipe(map((membresia) => this.mapWithSocio(membresia, socios)));
  }

  createMembresia(payload: MembresiaCreateApiRequest): Observable<MembresiaApiResponse> {
    return this.http.post<MembresiaApiResponse>(this.membresiasUrl, payload);
  }

  createMembresiaConPagoInicial(
    payload: MembresiaAltaConPagoApiRequest
  ): Observable<MembresiaApiResponse> {
    return this.http.post<MembresiaApiResponse>(`${this.membresiasUrl}/alta-con-pago`, payload);
  }

  updateMembresia(
    id: number,
    payload: MembresiaUpdateApiRequest
  ): Observable<MembresiaApiResponse> {
    return this.http.put<MembresiaApiResponse>(`${this.membresiasUrl}/${id}`, payload);
  }

  updateEstado(id: number, estado: EstadoMembresia): Observable<MembresiaApiResponse> {
    const payload: MembresiaEstadoUpdateRequest = { estado };
    return this.http.patch<MembresiaApiResponse>(`${this.membresiasUrl}/${id}/estado`, payload);
  }

  private mapWithSocio(
    membresia: MembresiaApiResponse,
    socios?: SocioViewModel[]
  ): MembresiaViewModel {
    const socio = socios?.find((currentSocio) => currentSocio.id === membresia.socioId);
    return mapMembresiaApiResponseToViewModel(membresia, socio);
  }
}
