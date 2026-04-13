import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { apiBaseUrl } from '../../../core/config/api.config';
import { SocioViewModel } from '../../socios/models/socio.model';
import { mapPagoApiResponseToViewModel } from '../mappers/pago.mapper';
import { PagoApiResponse, PagoCreateApiRequest, PagoFilters, PagoViewModel } from '../models/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly pagosUrl = `${apiBaseUrl}/pagos`;

  getPagos(socios?: SocioViewModel[]): Observable<PagoViewModel[]> {
    return this.http
      .get<PagoApiResponse[]>(this.pagosUrl)
      .pipe(map((pagos) => pagos.map((pago) => this.mapWithSocio(pago, socios))));
  }

  getPagoById(id: number, socios?: SocioViewModel[]): Observable<PagoViewModel> {
    return this.http
      .get<PagoApiResponse>(`${this.pagosUrl}/${id}`)
      .pipe(map((pago) => this.mapWithSocio(pago, socios)));
  }

  getPagosBySocioId(socioId: number, socios?: SocioViewModel[]): Observable<PagoViewModel[]> {
    return this.http
      .get<PagoApiResponse[]>(`${this.pagosUrl}/socio/${socioId}`)
      .pipe(map((pagos) => pagos.map((pago) => this.mapWithSocio(pago, socios))));
  }

  getPagosByMembresiaId(
    membresiaId: number,
    socios?: SocioViewModel[]
  ): Observable<PagoViewModel[]> {
    return this.http
      .get<PagoApiResponse[]>(`${this.pagosUrl}/membresia/${membresiaId}`)
      .pipe(map((pagos) => pagos.map((pago) => this.mapWithSocio(pago, socios))));
  }

  createPago(payload: PagoCreateApiRequest): Observable<PagoApiResponse> {
    return this.http.post<PagoApiResponse>(this.pagosUrl, payload);
  }

  filterPagos(pagos: PagoViewModel[], filters?: PagoFilters): PagoViewModel[] {
    return pagos.filter((pago) => {
      const socioSearch = filters?.socio?.trim().toLowerCase() ?? '';
      const matchesSocio =
        !socioSearch ||
        pago.socioNombre.toLowerCase().includes(socioSearch) ||
        (pago.socioDni ?? '').toLowerCase().includes(socioSearch);

      const matchesMetodo = !filters?.metodoPago || pago.metodoPago === filters.metodoPago;

      const paymentDate = pago.fechaPago?.slice(0, 10) ?? '';
      const matchesFechaDesde = !filters?.fechaDesde || paymentDate >= filters.fechaDesde;
      const matchesFechaHasta = !filters?.fechaHasta || paymentDate <= filters.fechaHasta;

      const search = filters?.busqueda?.trim().toLowerCase() ?? '';
      const matchesBusqueda =
        !search ||
        pago.id.toString().includes(search) ||
        pago.socioNombre.toLowerCase().includes(search) ||
        (pago.socioDni ?? '').toLowerCase().includes(search) ||
        (pago.descripcionMembresia ?? '').toLowerCase().includes(search) ||
        (pago.observaciones ?? '').toLowerCase().includes(search);

      return matchesSocio && matchesMetodo && matchesFechaDesde && matchesFechaHasta && matchesBusqueda;
    });
  }

  private mapWithSocio(pago: PagoApiResponse, socios?: SocioViewModel[]): PagoViewModel {
    const socio = socios?.find((currentSocio) => currentSocio.id === pago.socioId);
    return mapPagoApiResponseToViewModel(pago, socio);
  }
}
