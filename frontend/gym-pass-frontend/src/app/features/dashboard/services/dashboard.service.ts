import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { AsistenciasService } from '../../asistencias/services/asistencias.service';
import { MembresiaViewModel } from '../../membresias/models/membresia.model';
import { MembresiasService } from '../../membresias/services/membresias.service';
import { PagosService } from '../../pagos/services/pagos.service';
import { SociosService } from '../../socios/services/socios.service';
import {
  DashboardCalendarDayViewModel,
  DashboardMetricCardViewModel,
  DashboardMetricGroupViewModel,
  DashboardSummaryViewModel
} from '../models/dashboard.model';

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function previousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function toLocalDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toCalendarDay(
  date: Date | null,
  cantidad: number,
  fueraDeMes: boolean
): DashboardCalendarDayViewModel {
  return {
    fecha: date ? toLocalIsoDate(date) : null,
    diaMes: date ? date.getDate().toString() : '',
    diaSemana: date
      ? new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(date)
      : '',
    cantidad,
    fueraDeMes
  };
}

function buildCalendarDays(
  desdeIso: string,
  hastaIso: string,
  asistenciasPorFecha: { fecha?: string | null; cantidad: number }[]
): DashboardCalendarDayViewModel[] {
  const desde = toLocalDate(desdeIso);
  const hasta = toLocalDate(hastaIso);

  if (!desde || !hasta) {
    return [];
  }

  const cantidadesPorFecha = new Map(
    asistenciasPorFecha
      .filter((item) => !!item.fecha)
      .map((item) => [item.fecha as string, item.cantidad])
  );
  const calendarDays: DashboardCalendarDayViewModel[] = [];
  const firstDayOffset = (desde.getDay() + 6) % 7;

  for (let index = 0; index < firstDayOffset; index += 1) {
    calendarDays.push(toCalendarDay(null, 0, true));
  }

  const currentDate = new Date(desde);

  while (currentDate <= hasta) {
    const currentIso = toLocalIsoDate(currentDate);
    calendarDays.push(toCalendarDay(
      new Date(currentDate),
      cantidadesPorFecha.get(currentIso) ?? 0,
      false
    ));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(toCalendarDay(null, 0, true));
  }

  return calendarDays;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(dateValue: string | null | undefined, todayIso: string): boolean {
  return !!dateValue && dateValue.slice(0, 10) === todayIso;
}

function isSameMonth(dateValue: string | null | undefined, referenceDate: Date): boolean {
  const targetDate = toLocalDate(dateValue);

  if (!targetDate) {
    return false;
  }

  return (
    targetDate.getFullYear() === referenceDate.getFullYear() &&
    targetDate.getMonth() === referenceDate.getMonth()
  );
}

function isBetweenTodayAndNextDays(
  dateValue: string | null | undefined,
  today: Date,
  nextDays: number
): boolean {
  const targetDate = toLocalDate(dateValue);

  if (!targetDate) {
    return false;
  }

  const todayStart = startOfDay(today);
  const maxDate = new Date(todayStart);
  maxDate.setDate(maxDate.getDate() + nextDays);

  return targetDate >= todayStart && targetDate <= maxDate;
}

function sortByFechaVencimientoAsc(
  left: MembresiaViewModel,
  right: MembresiaViewModel
): number {
  return (left.fechaVencimiento ?? '').localeCompare(right.fechaVencimiento ?? '');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly sociosService = inject(SociosService);
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly pagosService = inject(PagosService);
  private readonly membresiasService = inject(MembresiasService);

  getDashboardSummary(): Observable<DashboardSummaryViewModel> {
    return this.sociosService.getSocios().pipe(
      map((socios) => {
        const today = new Date();
        const previousMonthDate = previousMonth(today);
        const sociosRecientes = [...socios]
          .filter((socio) => isSameMonth(socio.fechaAlta, previousMonthDate))
          .sort((left, right) => {
            const fechaComparison = (right.fechaAlta ?? '').localeCompare(left.fechaAlta ?? '');
            return fechaComparison || right.id - left.id;
          })
          .slice(0, 5);

        return {
          socios,
          sociosRecientes,
          today,
          todayIso: toLocalIsoDate(today),
          monthStartIso: toLocalIsoDate(startOfMonth(today)),
          monthEndIso: toLocalIsoDate(endOfMonth(today)),
          previousMonthStartIso: toLocalIsoDate(startOfMonth(previousMonthDate)),
          previousMonthEndIso: toLocalIsoDate(endOfMonth(previousMonthDate)),
          mesAnteriorReferencia: formatMonthLabel(previousMonthDate),
          sociosActivos: socios.filter((socio) => socio.estado === 'ACTIVO').length,
          sociosInactivos: socios.filter((socio) => socio.estado === 'INACTIVO').length
        };
      }),
      switchMap(({ socios, sociosRecientes, today, todayIso, mesAnteriorReferencia, previousMonthStartIso, previousMonthEndIso, sociosActivos, sociosInactivos }) =>
        forkJoin({
          membresias: this.membresiasService.getMembresias(socios),
          asistencias: this.asistenciasService.getAsistenciasHoy(socios),
          resumenAsistencias: this.asistenciasService.getResumenAsistencias(previousMonthStartIso, previousMonthEndIso),
          pagos: this.pagosService.getPagos(socios)
        }).pipe(
          map(({ membresias, asistencias, resumenAsistencias, pagos }) => {
            const pagosHoy = pagos.filter((pago) => isSameDay(pago.fechaPago, todayIso));
            const pagosMes = pagos.filter((pago) => isSameMonth(pago.fechaPago, today));
            const montoTotalCobrado = pagos.reduce((total, pago) => total + pago.monto, 0);
            const montoCobradoHoy = pagosHoy.reduce((total, pago) => total + pago.monto, 0);
            const montoCobradoMes = pagosMes.reduce((total, pago) => total + pago.monto, 0);
            const mesReferencia = formatMonthLabel(today);
            const sociosConMembresia = new Set(
              membresias
                .map((membresia) => membresia.socioId)
                .filter((socioId): socioId is number => socioId !== null)
            );
            const sociosSinMembresia = socios.filter(
              (socio) => socio.estado === 'ACTIVO' && !sociosConMembresia.has(socio.id)
            );
            const sociosActivosSinMembresia = sociosSinMembresia.length;
            const membresiasActivas = membresias.filter(
              (membresia) => membresia.estadoVisual === 'ACTIVA'
            ).length;
            const membresiasPendientesPago = membresias.filter(
              (membresia) => membresia.estadoVisual === 'PENDIENTE_PAGO'
            ).length;
            const membresiasVencidas = membresias.filter(
              (membresia) => membresia.estadoVisual === 'VENCIDA'
            ).length;
            const membresiasCanceladas = membresias.filter(
              (membresia) => membresia.estadoVisual === 'CANCELADA'
            ).length;
            const membresiasPorVencer = [...membresias]
              .filter(
                (membresia) =>
                  membresia.estadoVisual !== 'CANCELADA' &&
                  isBetweenTodayAndNextDays(membresia.fechaVencimiento, today, 7)
              )
              .sort(sortByFechaVencimientoAsc)
              .slice(0, 5);
            const membresiasConDeuda = [...membresias]
              .filter((membresia) => (membresia.saldoPendiente ?? 0) > 0)
              .sort((left, right) => (right.saldoPendiente ?? 0) - (left.saldoPendiente ?? 0))
              .slice(0, 5);
            const ultimosPagos = [...pagos]
              .sort((left, right) => (right.fechaPago ?? '').localeCompare(left.fechaPago ?? ''))
              .slice(0, 5);
            const ultimasAsistencias = [...asistencias]
              .sort((left, right) => (right.fechaHoraEntrada ?? '').localeCompare(left.fechaHoraEntrada ?? ''))
              .slice(0, 5);
            const sociosUnicosHoy = new Set(
              asistencias
                .map((asistencia) => asistencia.socioId)
                .filter((socioId): socioId is number => socioId !== null)
            ).size;
            const asistenciasAbiertasHoy = asistencias.filter(
              (asistencia) => asistencia.estado === 'ABIERTA'
            ).length;
            const asistenciasPorDia = resumenAsistencias.asistenciasPorDia ?? [];
            const asistenciasPorFecha = resumenAsistencias.asistenciasPorFecha ?? [];
            const asistenciasPorFranjaHoraria =
              resumenAsistencias.asistenciasPorFranjaHoraria ?? [];
            const asistenciasPorDiaYFranja =
              resumenAsistencias.asistenciasPorDiaYFranja ?? [];
            const diasAsistencia = asistenciasPorDia
              .map((item) => item.dia)
              .filter((dia): dia is string => !!dia);
            const franjasAsistencia = asistenciasPorFranjaHoraria
              .map((item) => item.franja)
              .filter((franja): franja is string => !!franja);
            const maxAsistenciasPorCelda = Math.max(
              0,
              ...asistenciasPorDiaYFranja.map((item) => item.cantidad)
            );
            const calendarioAsistenciasMesAnterior = buildCalendarDays(
              previousMonthStartIso,
              previousMonthEndIso,
              asistenciasPorFecha
            );
            const maxAsistenciasPorFecha = Math.max(
              0,
              ...calendarioAsistenciasMesAnterior.map((item) => item.cantidad)
            );
            const maxAsistenciasPorFranja = Math.max(
              0,
              ...asistenciasPorFranjaHoraria.map((item) => item.cantidad)
            );

            const sociosMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Total',
                value: socios.length.toString(),
                helper: 'Socios registrados.'
              },
              {
                label: 'Activos',
                value: sociosActivos.toString(),
                helper: 'Socios habilitados.'
              },
              {
                label: 'Inactivos',
                value: sociosInactivos.toString(),
                helper: 'Socios dados de baja.'
              }
            ];

            const membresiasMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Activas',
                value: membresiasActivas.toString(),
                helper: 'Vigentes al dia.'
              },
              {
                label: 'Vencidas',
                value: membresiasVencidas.toString(),
                helper: 'Requieren renovacion.'
              },
              {
                label: 'Pendientes',
                value: membresiasPendientesPago.toString(),
                helper: 'Con saldo pendiente.'
              },
              {
                label: 'Canceladas',
                value: membresiasCanceladas.toString(),
                helper: 'Bajas manuales.'
              },
              {
                label: 'Sin membresia',
                value: sociosActivosSinMembresia.toString(),
                helper: 'Socios activos sin membresia cargada.'
              }
            ];

            const asistenciasMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Socios hoy',
                value: sociosUnicosHoy.toString(),
                helper: 'Socios distintos que asistieron en el dia actual.'
              },
              {
                label: 'Asistencias mes anterior',
                value: resumenAsistencias.totalAsistencias.toString(),
                helper: `Dias/asistencias registradas en ${mesAnteriorReferencia}.`
              },
              {
                label: 'Activos sin asistencia',
                value: resumenAsistencias.sociosActivosSinAsistencia.toString(),
                helper: `Socios activos sin registros en ${mesAnteriorReferencia}.`
              }
            ];

            const pagosMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Hoy',
                value: pagosHoy.length.toString(),
                helper: formatCurrency(montoCobradoHoy)
              },
              {
                label: 'Mes actual',
                value: pagosMes.length.toString(),
                helper: `${mesReferencia}: ${formatCurrency(montoCobradoMes)}`
              },
              {
                label: 'Total',
                value: pagos.length.toString(),
                helper: formatCurrency(montoTotalCobrado)
              }
            ];

            const metricGroups: DashboardMetricGroupViewModel[] = [
              { title: 'Socios', icon: 'groups', metrics: sociosMetrics },
              { title: 'Membresias', icon: 'card_membership', metrics: membresiasMetrics },
              { title: 'Asistencias', icon: 'fact_check', metrics: asistenciasMetrics },
              { title: 'Pagos', icon: 'payments', metrics: pagosMetrics }
            ];

            const metrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Total de socios',
                value: socios.length.toString(),
                helper: 'Cantidad total de socios registrados.'
              },
              {
                label: 'Socios activos',
                value: sociosActivos.toString(),
                helper: 'Socios disponibles actualmente para operar.'
              },
              {
                label: 'Socios inactivos',
                value: sociosInactivos.toString(),
                helper: 'Socios que hoy figuran con estado inactivo.'
              },
              {
                label: 'Membresias activas',
                value: membresiasActivas.toString(),
                helper: 'Membresias vigentes y sin deuda pendiente.'
              },
              {
                label: 'Pendientes de pago',
                value: membresiasPendientesPago.toString(),
                helper: 'Membresias con saldo pendiente de regularizar.'
              },
              {
                label: 'Membresias vencidas',
                value: membresiasVencidas.toString(),
                helper: 'Membresias cuya fecha de vencimiento ya expiro.'
              },
              {
                label: 'Membresias canceladas',
                value: membresiasCanceladas.toString(),
                helper: 'Membresias dadas de baja manualmente.'
              },
              {
                label: 'Asistencias de hoy',
                value: asistencias.length.toString(),
                helper: 'Registros cargados durante el dia actual.'
              },
              {
                label: 'Pagos registrados',
                value: pagos.length.toString(),
                helper: 'Cantidad total de pagos cargados.'
              },
              {
                label: 'Monto total cobrado',
                value: formatCurrency(montoTotalCobrado),
                helper: 'Suma de todos los pagos registrados.'
              },
              {
                label: 'Pagos del mes',
                value: pagosMes.length.toString(),
                helper: `Pagos registrados en ${mesReferencia}.`
              },
              {
                label: 'Monto cobrado del mes',
                value: formatCurrency(montoCobradoMes),
                helper: `Suma de pagos registrados en ${mesReferencia}.`
              },
              {
                label: 'Pagos de hoy',
                value: pagosHoy.length.toString(),
                helper: 'Pagos cuya fecha corresponde al dia actual.'
              },
              {
                label: 'Monto cobrado hoy',
                value: formatCurrency(montoCobradoHoy),
                helper: 'Suma de pagos registrados en la fecha actual.'
              }
            ];

            return {
              mesReferencia,
              mesAnteriorReferencia,
              totalSocios: socios.length,
              sociosActivos,
              sociosInactivos,
              sociosActivosSinMembresia,
              membresiasActivas,
              membresiasPendientesPago,
              membresiasVencidas,
              membresiasCanceladas,
              asistenciasHoy: sociosUnicosHoy,
              totalPagos: pagos.length,
              montoTotalCobrado,
              pagosHoy: pagosHoy.length,
              montoCobradoHoy,
              pagosMes: pagosMes.length,
              montoCobradoMes,
              asistenciasMesAnterior: resumenAsistencias.totalAsistencias,
              sociosActivosSinAsistenciaMesAnterior: resumenAsistencias.sociosActivosSinAsistencia,
              asistenciasAbiertasHoy,
              sociosSinMembresia,
              membresiasPorVencer,
              membresiasConDeuda,
              ultimosPagos,
              ultimasAsistencias,
              topSociosAsistencias: resumenAsistencias.topSocios,
              sociosMenosAsistencias: resumenAsistencias.sociosConMenosAsistencias ?? [],
              diasAsistencia,
              franjasAsistencia,
              asistenciasPorDia,
              asistenciasPorFecha,
              asistenciasPorFranjaHoraria,
              asistenciasPorDiaYFranja,
              calendarioAsistenciasMesAnterior,
              maxAsistenciasPorFecha,
              maxAsistenciasPorCelda,
              maxAsistenciasPorFranja,
              resumenAsistencias,
              sociosRecientes,
              metrics,
              metricGroups
            };
          })
        )
      )
    );
  }
}
