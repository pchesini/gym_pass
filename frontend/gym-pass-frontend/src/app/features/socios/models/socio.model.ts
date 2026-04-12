export type EstadoSocio = 'ACTIVO' | 'INACTIVO';

export interface SocioApiResponse {
  id: number;
  nombreCompleto: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  estado: EstadoSocio;
  qrCode?: string | null;
  fechaAlta?: string | null;
  fechaNacimiento?: string | null;
}

export interface SocioCreateApiRequest {
  nombreCompleto: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento?: string | null;
}

export interface SocioUpdateApiRequest {
  nombreCompleto: string;
  email: string;
  telefono: string;
  fechaNacimiento?: string | null;
}

export interface SocioViewModel {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string;
  email: string;
  telefono: string;
  estado: EstadoSocio;
  qrCode?: string | null;
  fechaAlta?: string | null;
  fechaNacimiento?: string | null;
}

export interface SocioFormValue {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  estado: EstadoSocio;
  fechaNacimiento: Date | null;
}

export interface SocioFilters {
  busqueda?: string;
  estado?: EstadoSocio | '';
}

export interface EstadoSocioUpdateRequest {
  estado: EstadoSocio;
}

export interface SocioQrApiResponse {
  qr: string;
  url: string;
}
