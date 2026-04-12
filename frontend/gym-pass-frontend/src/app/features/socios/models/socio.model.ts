export type EstadoSocio = 'ACTIVO' | 'INACTIVO' | 'MOROSO';

export interface PlanSocio {
  id: number;
  nombre: string;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  fechaAlta: string;
  estado: EstadoSocio;
  fechaVencimiento: string | null;
  planId: number | null;
  planNombre: string | null;
}

export interface SocioRequest {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  fechaAlta: string;
  estado: EstadoSocio;
  planId: number | null;
}

export interface SocioFilters {
  busqueda?: string;
  estado?: EstadoSocio | '';
}

export interface EstadoSocioUpdateRequest {
  estado: EstadoSocio;
}
