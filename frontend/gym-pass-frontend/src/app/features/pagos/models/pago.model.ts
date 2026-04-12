export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MERCADO_PAGO';
export type EstadoPago = 'CONFIRMADO' | 'PENDIENTE' | 'ANULADO';

export interface Pago {
  id: number;
  socioId: number;
  socioNombre: string;
  socioApellido: string;
  membresiaId: number;
  membresiaNombre: string;
  fechaPago: string;
  fechaVencimientoGenerada: string | null;
  monto: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  observaciones: string | null;
}

export interface PagoRequest {
  socioId: number;
  membresiaId: number;
  fechaPago: string;
  monto: number;
  metodoPago: MetodoPago;
  observaciones: string;
}

export interface PagoFilters {
  socio?: string;
  metodoPago?: MetodoPago | '';
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: EstadoPago | '';
  busqueda?: string;
}

export interface PagoPreview {
  socioId: number;
  socioNombre: string;
  socioApellido: string;
  membresiaId: number;
  membresiaNombre: string;
  duracionDias: number;
  fechaVencimientoEstimada: string | null;
  montoSugerido: number | null;
}

export interface VencimientoProximo {
  socioId: number;
  socioNombre: string;
  socioApellido: string;
  membresiaNombre: string;
  fechaVencimiento: string;
  diasRestantes: number;
}
