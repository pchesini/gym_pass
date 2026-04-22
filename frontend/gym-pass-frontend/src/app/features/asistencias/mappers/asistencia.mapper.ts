import { SocioViewModel } from '../../socios/models/socio.model';
import { MembresiaViewModel } from '../../membresias/models/membresia.model';
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

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function hasExplicitTimezone(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function formatDateParts(date: Date): string {
  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatDateTimeParts(date: Date): string {
  return `${formatDateParts(date)} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

export function formatAsistenciaDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : formatDateParts(parsedDate);
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatAsistenciaDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  if (hasExplicitTimezone(value)) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : formatDateTimeParts(parsedDate);
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!match) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : formatDateTimeParts(parsedDate);
  }

  const [, year, month, day, hours = '00', minutes = '00'] = match;
  return `${day}/${month}/${year} ${hours}:${minutes}`;
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
  // El backend real exige credencialId en el alta de asistencia.
  // Mientras no exista un flujo/frontend de credenciales separado,
  // la recepcion reutiliza el socioId como resolucion minima para no romper la integracion actual.
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
  asistencias: AsistenciaViewModel[],
  membresias: MembresiaViewModel[] = []
): SocioAsistenciaLookup {
  const sortedAsistencias = [...asistencias].sort((left, right) =>
    (right.fechaHoraEntrada ?? '').localeCompare(left.fechaHoraEntrada ?? '')
  );
  const asistenciaAbierta = sortedAsistencias.find((asistencia) => asistencia.estado === 'ABIERTA') ?? null;
  const ultimaAsistencia = sortedAsistencias[0] ?? null;
  const membresiaVigente = [...membresias]
    .filter((membresia) => membresia.estadoVisual === 'ACTIVA' || membresia.estadoVisual === 'PENDIENTE_PAGO')
    .sort((left, right) => (right.fechaVencimiento ?? '').localeCompare(left.fechaVencimiento ?? ''))[0] ?? null;
  const tieneSaldoPendiente = (membresiaVigente?.saldoPendiente ?? 0) > 0;

  let mensajeRecepcion: string | null = null;

  if (socio.estado !== 'ACTIVO') {
    mensajeRecepcion = 'El socio esta inactivo y no puede registrar asistencia.';
  } else if (asistenciaAbierta) {
    mensajeRecepcion = 'El socio tiene una asistencia abierta. Podes registrar la salida.';
  } else if (tieneSaldoPendiente) {
    mensajeRecepcion = 'Puede ingresar, pero tiene un saldo pendiente en su membresia.';
  } else {
    mensajeRecepcion = 'Socio listo para registrar una nueva entrada.';
  }

  return {
    socio,
    asistenciaAbierta,
    ultimaAsistencia,
    mensajeRecepcion,
    estadoMembresia: membresiaVigente?.estadoVisual ?? null,
    saldoPendienteMembresia: membresiaVigente?.saldoPendiente ?? null,
    tieneSaldoPendiente,
    puedeRegistrarEntrada: socio.estado === 'ACTIVO' && !asistenciaAbierta,
    puedeRegistrarSalida: !!asistenciaAbierta
  };
}
