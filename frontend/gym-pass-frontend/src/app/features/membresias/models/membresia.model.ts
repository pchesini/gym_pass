export type EstadoMembresia = 'ACTIVA' | 'INACTIVA';

export interface Membresia {
  id: number;
  nombre: string;
  descripcion: string;
  duracionDias: number;
  precio: number;
  estado: EstadoMembresia;
}

export interface MembresiaRequest {
  nombre: string;
  descripcion: string;
  duracionDias: number;
  precio: number;
  estado: EstadoMembresia;
}

export interface EstadoMembresiaUpdateRequest {
  estado: EstadoMembresia;
}
