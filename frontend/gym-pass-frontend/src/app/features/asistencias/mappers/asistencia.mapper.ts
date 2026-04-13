import { SocioViewModel } from '../../socios/models/socio.model';
import {
  AsistenciaApiResponse,
  AsistenciaCreateApiRequest,
  AsistenciaViewModel,
  BuscarSocioRequest,
  CriterioBusquedaSocio,
  SocioAsistenciaLookup
} from '../models/asistencia.model';

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function formatDateToIso(date: Date): string {
  return date.toISOString();
}

export function mapAsistenciaApiResponseToViewModel(
  asistencia: AsistenciaApiResponse,
  socio?: SocioViewModel
): AsistenciaViewModel {
  return {
    id: asistencia.id,
    socioId: asistencia.socioId,
    socioNombre: socio?.nombreCompleto ?? `Socio #${asistencia.socioId ?? 'N/D'}`,
    socioDni: socio?.dni ?? null,
    fechaHoraEntrada: asistencia.fechaHoraEntrada,
    fechaHoraSalida: asistencia.fechaHoraSalida,
    duracionMinutos: asistencia.duracionMinutos,
    tipoRegistro: asistencia.tipoRegistro,
    estado: asistencia.fechaHoraSalida ? 'CERRADA' : 'ABIERTA'
  };
}

export function mapAsistenciaFormToCreateRequest(
  socioId: number,
  credencialId: number
): AsistenciaCreateApiRequest {
  return {
    socioId,
    credencialId,
    fechaHoraEntrada: formatDateToIso(new Date()),
    tipoRegistro: 'SELF_SERVICE',
    registradoPorUsuarioId: null
  };
}

export function buscarSociosEnFrontend(
  socios: SocioViewModel[],
  request: BuscarSocioRequest
): SocioViewModel[] {
  const searchValue = normalizeText(request.valor);

  if (!searchValue) {
    return [];
  }

  return socios.filter((socio) => {
    switch (request.criterio as CriterioBusquedaSocio) {
      case 'DNI':
      case 'CODIGO':
        return normalizeText(socio.dni).includes(searchValue);
      case 'NOMBRE':
        return normalizeText(socio.nombre).includes(searchValue);
      case 'APELLIDO':
        return normalizeText(socio.apellido).includes(searchValue);
      default:
        return normalizeText(socio.nombreCompleto).includes(searchValue);
    }
  });
}

export function buildSocioAsistenciaLookup(
  socio: SocioViewModel,
  asistencias: AsistenciaViewModel[]
): SocioAsistenciaLookup {
  const sortedAsistencias = [...asistencias].sort((left, right) =>
    (right.fechaHoraEntrada ?? '').localeCompare(left.fechaHoraEntrada ?? '')
  );
  const asistenciaAbierta = sortedAsistencias.find((asistencia) => asistencia.estado === 'ABIERTA') ?? null;
  const ultimaAsistencia = sortedAsistencias[0] ?? null;

  let mensajeRecepcion: string | null = null;

  if (socio.estado !== 'ACTIVO') {
    mensajeRecepcion = 'El socio esta inactivo y no puede registrar asistencia.';
  } else if (asistenciaAbierta) {
    mensajeRecepcion = 'El socio tiene una asistencia abierta. Podes registrar la salida.';
  } else {
    mensajeRecepcion = 'Socio listo para registrar una nueva entrada.';
  }

  return {
    socio,
    asistenciaAbierta,
    ultimaAsistencia,
    mensajeRecepcion,
    puedeRegistrarEntrada: socio.estado === 'ACTIVO' && !asistenciaAbierta,
    puedeRegistrarSalida: !!asistenciaAbierta
  };
}
