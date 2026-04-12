import {
  SocioApiResponse,
  SocioCreateApiRequest,
  SocioFormValue,
  SocioUpdateApiRequest,
  SocioViewModel
} from '../models/socio.model';

function splitNombreCompleto(nombreCompleto: string): { nombre: string; apellido: string } {
  const normalizedNombreCompleto = nombreCompleto.trim().replace(/\s+/g, ' ');

  if (!normalizedNombreCompleto) {
    return { nombre: '', apellido: '' };
  }

  const [nombre, ...apellidoParts] = normalizedNombreCompleto.split(' ');

  return {
    nombre,
    apellido: apellidoParts.join(' ')
  };
}

function buildNombreCompleto(nombre: string, apellido: string): string {
  return `${nombre.trim()} ${apellido.trim()}`.trim().replace(/\s+/g, ' ');
}

function formatDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function mapSocioApiResponseToViewModel(socio: SocioApiResponse): SocioViewModel {
  const { nombre, apellido } = splitNombreCompleto(socio.nombreCompleto);

  return {
    id: socio.id,
    nombreCompleto: socio.nombreCompleto,
    nombre,
    apellido,
    dni: socio.dni,
    email: socio.email ?? '',
    telefono: socio.telefono ?? '',
    estado: socio.estado,
    qrCode: socio.qrCode ?? null,
    fechaAlta: socio.fechaAlta ?? null,
    fechaNacimiento: socio.fechaNacimiento ?? null
  };
}

export function mapSocioFormValueToCreateApiRequest(
  formValue: SocioFormValue
): SocioCreateApiRequest {
  return {
    nombreCompleto: buildNombreCompleto(formValue.nombre, formValue.apellido),
    dni: formValue.dni.trim(),
    email: formValue.email.trim(),
    telefono: formValue.telefono.trim(),
    fechaNacimiento: formatDate(formValue.fechaNacimiento)
  };
}

export function mapSocioFormValueToUpdateApiRequest(
  formValue: SocioFormValue
): SocioUpdateApiRequest {
  return {
    nombreCompleto: buildNombreCompleto(formValue.nombre, formValue.apellido),
    email: formValue.email.trim(),
    telefono: formValue.telefono.trim(),
    fechaNacimiento: formatDate(formValue.fechaNacimiento)
  };
}
