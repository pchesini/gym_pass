import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  EstadoMembresia,
  EstadoMembresiaUpdateRequest,
  Membresia,
  MembresiaRequest
} from '../models/membresia.model';

@Injectable({
  providedIn: 'root'
})
export class MembresiasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/v1/membresias';

  getMembresias(): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(this.apiUrl);
  }

  getMembresiaById(id: number): Observable<Membresia> {
    return this.http.get<Membresia>(`${this.apiUrl}/${id}`);
  }

  createMembresia(payload: MembresiaRequest): Observable<Membresia> {
    return this.http.post<Membresia>(this.apiUrl, payload);
  }

  updateMembresia(id: number, payload: MembresiaRequest): Observable<Membresia> {
    return this.http.put<Membresia>(`${this.apiUrl}/${id}`, payload);
  }

  updateEstado(id: number, estado: EstadoMembresia): Observable<Membresia> {
    const payload: EstadoMembresiaUpdateRequest = { estado };
    return this.http.patch<Membresia>(`${this.apiUrl}/${id}/estado`, payload);
  }
}
