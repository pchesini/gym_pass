import { SocioViewModel } from '../../socios/models/socio.model';
import { MembresiaViewModel } from '../../membresias/models/membresia.model';
import {
  DeudorApiResponse,
  DeudorViewModel,
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

function roundMoney(value: number | null | undefined): number {
  return Math.round(Number(value ?? 0));
}

function buildMembresiaDescription(membresiaId: number | null): string | null {
  return membresiaId ? `Membresia #${membresiaId}` : null;
}

function clampMoney(value: number): number {
  return Math.max(0, roundMoney(value));
}

function isPagoDelUltimoMes(pago: PagoViewModel, referenceDate = new Date()): boolean {
  if (!pago.fechaPago) {
    return false;
  }

  const fechaPago = new Date(pago.fechaPago);
  if (Number.isNaN(fechaPago.getTime())) {
    return false;
  }

  const fechaDesde = new Date(referenceDate);
  fechaDesde.setMonth(fechaDesde.getMonth() - 1);

  return fechaPago >= fechaDesde && fechaPago <= referenceDate;
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
    monto: roundMoney(pago.monto),
    metodoPago: pago.metodoPago,
    observaciones: pago.observaciones,
    estadoVisual: null,
    descripcionMembresia: buildMembresiaDescription(pago.membresiaId),
    promocionId: pago.promocionId,
    registradoPorUsuarioId: pago.registradoPorUsuarioId
  };
}

export function mapDeudorApiResponseToViewModel(deudor: DeudorApiResponse): DeudorViewModel {
  return {
    socioId: deudor.socioId,
    socioNombre: deudor.socioNombre ?? `Socio #${deudor.socioId ?? 'N/D'}`,
    socioDni: deudor.socioDni,
    membresiaId: deudor.membresiaId,
    fechaVencimiento: deudor.fechaVencimiento,
    estadoMembresia: deudor.estadoMembresia,
    saldoPendiente: roundMoney(deudor.saldoPendiente)
  };
}

export function mapPagoFormToCreateRequest(formValue: PagoFormValue): PagoCreateApiRequest {
  return {
    socioId: Number(formValue.socioId),
    membresiaId: formValue.membresiaId ? Number(formValue.membresiaId) : null,
    fechaPago: formatDateTimeToIso(formValue.fechaPago),
    monto: roundMoney(formValue.monto),
    metodoPago: formValue.metodoPago,
    observaciones: formValue.observaciones.trim() || null,
    promocionId: null,
    registradoPorUsuarioId: null
  };
}

export function buildPagoPreview(
  formValue: PagoFormValue,
  socio?: SocioViewModel,
  membresia?: MembresiaViewModel | null
): PagoPreviewViewModel {
  const monto = formValue.monto === null ? null : roundMoney(formValue.monto);
  const saldoPendienteActual = membresia?.saldoPendiente ?? null;
  const saldoRestanteEstimado =
    saldoPendienteActual === null || monto === null ? null : clampMoney(saldoPendienteActual - monto);

  return {
    socioNombre: socio?.nombreCompleto ?? 'Selecciona un socio',
    socioDni: socio?.dni ?? null,
    membresiaId: formValue.membresiaId,
    descripcionMembresia: buildMembresiaDescription(formValue.membresiaId),
    precioLista: membresia?.precioLista ?? null,
    saldoPendienteActual,
    fechaPago: formatDateTimeToIso(formValue.fechaPago),
    monto,
    saldoRestanteEstimado,
    metodoPago: formValue.metodoPago ?? null,
    observaciones: formValue.observaciones.trim() || null
  };
}

export function buildPagosSummary(
  pagos: PagoViewModel[],
  deudores: DeudorViewModel[] = []
): PagosSummaryViewModel {
  const pagosRecientes = [...pagos]
    .sort((left, right) => (right.fechaPago ?? '').localeCompare(left.fechaPago ?? ''))
    .slice(0, 4);
  const pagosUltimoMes = pagos.filter((pago) => isPagoDelUltimoMes(pago));

  return {
    totalPagos: pagosUltimoMes.length,
    montoTotal: pagosUltimoMes.reduce((total, pago) => total + pago.monto, 0),
    totalDeudores: deudores.length,
    saldoPendienteTotal: deudores.reduce((total, deudor) => total + deudor.saldoPendiente, 0),
    ultimoPagoFecha: pagosRecientes[0]?.fechaPago ?? null,
    ultimoPagoSocio: pagosRecientes[0]?.socioNombre ?? null,
    ultimoPagoMonto: pagosRecientes[0]?.monto ?? null,
    pagosRecientes
  };
}
