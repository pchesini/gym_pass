import { SocioViewModel } from '../../socios/models/socio.model';
import {
  PagoApiResponse,
  PagoCreateApiRequest,
  PagoFormValue,
  PagoPreviewViewModel,
  PagosSummaryViewModel,
  PagoViewModel
} from '../models/pago.model';

function formatDateTimeToIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function buildMembresiaDescription(membresiaId: number | null): string | null {
  return membresiaId ? `Membresia #${membresiaId}` : null;
}

export function mapPagoApiResponseToViewModel(
  pago: PagoApiResponse,
  socio?: SocioViewModel
): PagoViewModel {
  return {
    id: pago.id,
    socioId: pago.socioId,
    socioNombre: socio?.nombreCompleto ?? `Socio #${pago.socioId ?? 'N/D'}`,
    socioDni: socio?.dni ?? null,
    membresiaId: pago.membresiaId,
    fechaPago: pago.fechaPago,
    monto: Number(pago.monto),
    metodoPago: pago.metodoPago,
    observaciones: pago.observaciones,
    estadoVisual: null,
    descripcionMembresia: buildMembresiaDescription(pago.membresiaId),
    promocionId: pago.promocionId,
    registradoPorUsuarioId: pago.registradoPorUsuarioId
  };
}

export function mapPagoFormToCreateRequest(formValue: PagoFormValue): PagoCreateApiRequest {
  return {
    socioId: Number(formValue.socioId),
    membresiaId: formValue.membresiaId ? Number(formValue.membresiaId) : null,
    fechaPago: formatDateTimeToIso(formValue.fechaPago),
    monto: Number(formValue.monto ?? 0),
    metodoPago: formValue.metodoPago,
    observaciones: formValue.observaciones.trim() || null,
    promocionId: null,
    registradoPorUsuarioId: null
  };
}

export function buildPagoPreview(
  formValue: PagoFormValue,
  socio?: SocioViewModel
): PagoPreviewViewModel {
  return {
    socioNombre: socio?.nombreCompleto ?? 'Selecciona un socio',
    socioDni: socio?.dni ?? null,
    membresiaId: formValue.membresiaId,
    descripcionMembresia: buildMembresiaDescription(formValue.membresiaId),
    fechaPago: formatDateTimeToIso(formValue.fechaPago),
    monto: formValue.monto ?? null,
    metodoPago: formValue.metodoPago ?? null,
    observaciones: formValue.observaciones.trim() || null
  };
}

export function buildPagosSummary(pagos: PagoViewModel[]): PagosSummaryViewModel {
  const pagosRecientes = [...pagos]
    .sort((left, right) => (right.fechaPago ?? '').localeCompare(left.fechaPago ?? ''))
    .slice(0, 4);

  return {
    totalPagos: pagos.length,
    montoTotal: pagos.reduce((total, pago) => total + pago.monto, 0),
    ultimoPagoFecha: pagosRecientes[0]?.fechaPago ?? null,
    ultimoPagoSocio: pagosRecientes[0]?.socioNombre ?? null,
    pagosRecientes
  };
}
