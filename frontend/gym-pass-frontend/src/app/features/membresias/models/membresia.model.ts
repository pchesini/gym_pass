export type EstadoMembresia = 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PENDIENTE_PAGO';

export interface MembresiaApiResponse {
  id: number;
  socioId: number | null;
  fechaInicio: string | null;
  fechaVencimiento: string | null;
  estado: EstadoMembresia;
  precioLista: number | null;
  saldoPendiente: number | null;
}

export interface MembresiaCreateApiRequest {
  socioId: number;
  fechaInicio: string;
  fechaVencimiento: string;
  precioLista: number;
  saldoPendiente?: number | null;
}

export interface MembresiaUpdateApiRequest {
  fechaInicio?: string | null;
  fechaVencimiento?: string | null;
  precioLista?: number | null;
  saldoPendiente?: number | null;
}

export interface MembresiaEstadoUpdateRequest {
  estado: EstadoMembresia;
}

export interface MembresiaViewModel {
  id: number;
  socioId: number | null;
  socioNombre: string;
  socioDni?: string | null;
  fechaInicio: string | null;
  fechaVencimiento: string | null;
  estado: EstadoMembresia;
  precioLista: number | null;
  saldoPendiente: number | null;
  activa: boolean;
}

export interface MembresiaFormValue {
  socioId: number | null;
  fechaInicio: Date | null;
  fechaVencimiento: Date | null;
  precioLista: number | null;
  saldoPendiente: number | null;
}
