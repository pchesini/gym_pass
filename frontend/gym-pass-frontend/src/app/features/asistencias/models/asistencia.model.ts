import { EstadoSocio, SocioViewModel } from '../../socios/models/socio.model';

export type EstadoAsistencia = 'ABIERTA' | 'CERRADA';
export type CriterioBusquedaSocio = 'DNI' | 'NOMBRE' | 'APELLIDO' | 'CODIGO';
export type TipoRegistroAsistencia = 'STAFF' | 'SELF_SERVICE';

export interface AsistenciaApiResponse {
  id: number;
  socioId: number | null;
  credencialId: number | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  duracionMinutos: number | null;
  tipoRegistro: TipoRegistroAsistencia | null;
  registradoPorUsuarioId: number | null;
}

export interface AsistenciaCreateApiRequest {
  socioId: number;
  credencialId: number;
  fechaHoraEntrada: string;
  tipoRegistro: TipoRegistroAsistencia;
  registradoPorUsuarioId?: number | null;
}

export interface AsistenciaViewModel {
  id: number;
  socioId: number | null;
  socioNombre: string;
  socioDni?: string | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  duracionMinutos: number | null;
  tipoRegistro: string | null;
  estado: EstadoAsistencia;
}

export interface AsistenciaFilters {
  fecha?: string;
  socio?: string;
  estado?: EstadoAsistencia | '';
  busqueda?: string;
}

export interface SocioAsistenciaLookup {
  socio: SocioViewModel;
  asistenciaAbierta: AsistenciaViewModel | null;
  ultimaAsistencia: AsistenciaViewModel | null;
  mensajeRecepcion: string | null;
  estadoMembresia: string | null;
  saldoPendienteMembresia: number | null;
  tieneSaldoPendiente: boolean;
  puedeRegistrarEntrada: boolean;
  puedeRegistrarSalida: boolean;
}

export interface BuscarSocioRequest {
  criterio: CriterioBusquedaSocio;
  valor: string;
}

export interface AsistenciaQueryContext {
  socios: SocioViewModel[];
  asistencias: AsistenciaApiResponse[];
}

export interface SocioResumenAsistencia {
  id: number | null;
  nombreCompleto: string;
  dni: string | null;
  estado: EstadoSocio;
}
