export type MetodoPago = 'CREDITO' | 'DEBITO' | 'TRANSFERENCIA' | 'EFECTIVO' | 'OTRO';

export interface PagoApiResponse {
  id: number;
  socioId: number | null;
  membresiaId: number | null;
  fechaPago: string | null;
  monto: number;
  metodoPago: MetodoPago;
  observaciones: string | null;
  promocionId: number | null;
  registradoPorUsuarioId: number | null;
}

export interface DeudorApiResponse {
  socioId: number | null;
  socioNombre: string | null;
  socioDni: string | null;
  membresiaId: number;
  fechaVencimiento: string | null;
  estadoMembresia: string | null;
  saldoPendiente: number;
}

export interface DeudorViewModel {
  socioId: number | null;
  socioNombre: string;
  socioDni: string | null;
  membresiaId: number;
  fechaVencimiento: string | null;
  estadoMembresia: string | null;
  saldoPendiente: number;
}

export interface PagoCreateApiRequest {
  socioId: number;
  membresiaId?: number | null;
  fechaPago?: string | null;
  monto: number;
  metodoPago: MetodoPago;
  observaciones?: string | null;
  promocionId?: number | null;
  registradoPorUsuarioId?: number | null;
}

export interface PagoViewModel {
  id: number;
  socioId: number | null;
  socioNombre: string;
  socioDni?: string | null;
  membresiaId: number | null;
  fechaPago: string | null;
  monto: number;
  metodoPago: MetodoPago;
  observaciones: string | null;
  estadoVisual?: string | null;
  descripcionMembresia?: string | null;
  promocionId?: number | null;
  registradoPorUsuarioId?: number | null;
}

export interface PagoFilters {
  socio?: string;
  metodoPago?: MetodoPago | '';
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

export interface PagoFormValue {
  socioId: number | null;
  membresiaId: number | null;
  fechaPago: Date | null;
  monto: number | null;
  metodoPago: MetodoPago;
  observaciones: string;
}

export interface PagoPreviewViewModel {
  socioNombre: string;
  socioDni: string | null;
  membresiaId: number | null;
  descripcionMembresia: string | null;
  precioLista: number | null;
  saldoPendienteActual: number | null;
  fechaPago: string | null;
  monto: number | null;
  saldoRestanteEstimado: number | null;
  metodoPago: MetodoPago | null;
  observaciones: string | null;
}

export interface PagosSummaryViewModel {
  totalPagos: number;
  montoTotal: number;
  totalDeudores: number;
  saldoPendienteTotal: number;
  ultimoPagoFecha: string | null;
  ultimoPagoSocio: string | null;
  ultimoPagoMonto: number | null;
  pagosRecientes: PagoViewModel[];
}
