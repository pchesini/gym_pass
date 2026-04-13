import { SocioViewModel } from '../../socios/models/socio.model';
import {
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

export function mapMembresiaApiResponseToViewModel(
  membresia: MembresiaApiResponse,
  socio?: SocioViewModel
): MembresiaViewModel {
  return {
    id: membresia.id,
    socioId: membresia.socioId,
    socioNombre: socio?.nombreCompleto ?? `Socio #${membresia.socioId ?? 'N/D'}`,
    socioDni: socio?.dni ?? null,
    fechaInicio: membresia.fechaInicio,
    fechaVencimiento: membresia.fechaVencimiento,
    estado: membresia.estado,
    precioLista: membresia.precioLista,
    saldoPendiente: membresia.saldoPendiente,
    activa: membresia.estado === 'ACTIVA'
  };
}

export function mapMembresiaFormToCreateRequest(
  formValue: MembresiaFormValue
): MembresiaCreateApiRequest {
  return {
    socioId: Number(formValue.socioId),
    fechaInicio: toIsoDate(formValue.fechaInicio) ?? '',
    fechaVencimiento: toIsoDate(formValue.fechaVencimiento) ?? '',
    precioLista: Number(formValue.precioLista ?? 0),
    saldoPendiente: formValue.saldoPendiente ?? 0
  };
}

export function mapMembresiaFormToUpdateRequest(
  formValue: MembresiaFormValue
): MembresiaUpdateApiRequest {
  return {
    fechaInicio: toIsoDate(formValue.fechaInicio),
    fechaVencimiento: toIsoDate(formValue.fechaVencimiento),
    precioLista: formValue.precioLista ?? null,
    saldoPendiente: formValue.saldoPendiente ?? null
  };
}
