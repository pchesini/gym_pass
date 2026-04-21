import { SocioViewModel } from '../../socios/models/socio.model';
import {
  EstadoMembresia,
  MembresiaAltaConPagoApiRequest,
  MembresiaApiResponse,
  MembresiaCreateApiRequest,
  MembresiaFormValue,
  MembresiaUpdateApiRequest,
  MembresiaViewModel
} from '../models/membresia.model';

function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundMoney(value: number | null | undefined): number {
  return Math.round(Number(value ?? 0));
}

function parseLocalDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfToday(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function resolveEstadoVisual(membresia: MembresiaApiResponse): EstadoMembresia {
  if (membresia.estado !== 'ACTIVA') {
    return membresia.estado;
  }

  const fechaVencimiento = parseLocalDate(membresia.fechaVencimiento);
  if (!fechaVencimiento) {
    return membresia.estado;
  }

  return fechaVencimiento < startOfToday() ? 'VENCIDA' : membresia.estado;
}

export function mapMembresiaApiResponseToViewModel(
  membresia: MembresiaApiResponse,
  socio?: SocioViewModel
): MembresiaViewModel {
  const estadoVisual = resolveEstadoVisual(membresia);

  return {
    id: membresia.id,
    socioId: membresia.socioId,
    socioNombre: socio?.nombreCompleto ?? `Socio #${membresia.socioId ?? 'N/D'}`,
    socioDni: socio?.dni ?? null,
    fechaInicio: membresia.fechaInicio,
    fechaVencimiento: membresia.fechaVencimiento,
    estado: membresia.estado,
    estadoVisual,
    precioLista: roundMoney(membresia.precioLista),
    saldoPendiente: roundMoney(membresia.saldoPendiente),
    activa: estadoVisual === 'ACTIVA'
  };
}

export function mapMembresiaFormToCreateRequest(
  formValue: MembresiaFormValue
): MembresiaCreateApiRequest {
  return {
    socioId: Number(formValue.socioId),
    fechaInicio: toIsoDate(formValue.fechaInicio) ?? '',
    fechaVencimiento: toIsoDate(formValue.fechaVencimiento) ?? '',
    precioLista: roundMoney(formValue.precioLista),
    saldoPendiente: roundMoney(formValue.saldoPendiente)
  };
}

export function mapMembresiaFormToCreateWithPagoRequest(
  formValue: MembresiaFormValue
): MembresiaAltaConPagoApiRequest {
  return {
    socioId: Number(formValue.socioId),
    fechaInicio: toIsoDate(formValue.fechaInicio) ?? '',
    fechaVencimiento: toIsoDate(formValue.fechaVencimiento) ?? '',
    precioLista: roundMoney(formValue.precioLista),
    montoPagado: roundMoney(formValue.montoPagado),
    metodoPago: formValue.metodoPago,
    observacionesPago: formValue.observacionesPago.trim() || null
  };
}

export function mapMembresiaFormToUpdateRequest(
  formValue: MembresiaFormValue
): MembresiaUpdateApiRequest {
  return {
    fechaInicio: toIsoDate(formValue.fechaInicio),
    fechaVencimiento: toIsoDate(formValue.fechaVencimiento),
    precioLista: formValue.precioLista === null ? null : roundMoney(formValue.precioLista),
    saldoPendiente: formValue.saldoPendiente === null ? null : roundMoney(formValue.saldoPendiente)
  };
}
