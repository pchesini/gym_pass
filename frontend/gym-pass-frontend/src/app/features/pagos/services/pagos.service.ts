import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Pago,
  PagoFilters,
  PagoPreview,
  PagoRequest,
  VencimientoProximo
} from '../models/pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/pagos';

  getPagos(filters?: PagoFilters): Observable<Pago[]> {
    let params = new HttpParams();

    if (filters?.socio?.trim()) {
      params = params.set('socio', filters.socio.trim());
    }

    if (filters?.metodoPago) {
      params = params.set('metodoPago', filters.metodoPago);
    }

    if (filters?.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }

    if (filters?.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }

    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }

    if (filters?.busqueda?.trim()) {
      params = params.set('busqueda', filters.busqueda.trim());
    }

    return this.http.get<Pago[]>(this.apiUrl, { params });
  }

  getPagoById(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${id}`);
  }

  createPago(payload: PagoRequest): Observable<Pago> {
    return this.http.post<Pago>(this.apiUrl, payload);
  }

  getPreview(socioId: number, membresiaId: number, fechaPago: string): Observable<PagoPreview> {
    const params = new HttpParams()
      .set('socioId', socioId)
      .set('membresiaId', membresiaId)
      .set('fechaPago', fechaPago);

    return this.http.get<PagoPreview>(`${this.apiUrl}/preview`, { params });
  }

  getVencimientosProximos(): Observable<VencimientoProximo[]> {
    return this.http.get<VencimientoProximo[]>(`${this.apiUrl}/vencimientos-proximos`);
  }
}
