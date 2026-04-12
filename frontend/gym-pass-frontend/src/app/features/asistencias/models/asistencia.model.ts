export type EstadoAsistencia = 'EN_CURSO' | 'FINALIZADA' | 'OBSERVADA';
export type CriterioBusquedaSocio = 'DNI' | 'NOMBRE' | 'APELLIDO' | 'CODIGO';

export interface SocioAsistenciaLookup {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  estado: string;
  planNombre: string | null;
  fechaVencimiento: string | null;
  tieneMembresia: boolean;
  puedeRegistrarEntrada: boolean;
  puedeRegistrarSalida: boolean;
  mensajeRecepcion: string | null;
  codigoAcceso?: string | null;
}

export interface BuscarSocioRequest {
  criterio: CriterioBusquedaSocio;
  valor: string;
}

export interface Asistencia {
  id: number;
  socioId: number;
  socioNombre: string;
  socioApellido: string;
  socioDni: string;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  estado: EstadoAsistencia;
  observacion: string | null;
}

export interface AsistenciaResponse {
  asistencia: Asistencia;
  mensaje: string;
}

export interface AsistenciaFilters {
  fecha?: string;
  socio?: string;
  estado?: EstadoAsistencia | '';
  busqueda?: string;
}

export interface RegistroAsistenciaRequest {
  socioId: number;
}
