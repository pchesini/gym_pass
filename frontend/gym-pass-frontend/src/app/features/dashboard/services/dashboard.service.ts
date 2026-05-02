import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { AsistenciasService } from '../../asistencias/services/asistencias.service';
import { MembresiaViewModel } from '../../membresias/models/membresia.model';
import { MembresiasService } from '../../membresias/services/membresias.service';
import { PagosService } from '../../pagos/services/pagos.service';
import { SociosService } from '../../socios/services/socios.service';
import {
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
        const sortedSocios = [...socios].sort((left, right) => right.id - left.id);
        const today = new Date();
        return {
          socios,
          sociosRecientes: sortedSocios.slice(0, 5),
          today,
          todayIso: toLocalIsoDate(today),
          monthStartIso: toLocalIsoDate(startOfMonth(today)),
          monthEndIso: toLocalIsoDate(endOfMonth(today)),
          sociosActivos: socios.filter((socio) => socio.estado === 'ACTIVO').length,
          sociosInactivos: socios.filter((socio) => socio.estado === 'INACTIVO').length
        };
      }),
      switchMap(({ socios, sociosRecientes, today, todayIso, monthStartIso, monthEndIso, sociosActivos, sociosInactivos }) =>
        forkJoin({
          membresias: this.membresiasService.getMembresias(socios),
          asistencias: this.asistenciasService.getAsistenciasHoy(socios),
          resumenAsistencias: this.asistenciasService.getResumenAsistencias(monthStartIso, monthEndIso),
          pagos: this.pagosService.getPagos(socios)
        }).pipe(
          map(({ membresias, asistencias, resumenAsistencias, pagos }) => {
            const pagosHoy = pagos.filter((pago) => isSameDay(pago.fechaPago, todayIso));
            const pagosMes = pagos.filter((pago) => isSameMonth(pago.fechaPago, today));
            const montoTotalCobrado = pagos.reduce((total, pago) => total + pago.monto, 0);
            const montoCobradoHoy = pagosHoy.reduce((total, pago) => total + pago.monto, 0);
            const montoCobradoMes = pagosMes.reduce((total, pago) => total + pago.monto, 0);
            const mesReferencia = formatMonthLabel(today);
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
            const asistenciasAbiertasHoy = asistencias.filter(
              (asistencia) => asistencia.estado === 'ABIERTA'
            ).length;

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
              }
            ];

            const asistenciasMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Hoy',
                value: asistencias.length.toString(),
                helper: 'Entradas registradas hoy.'
              },
              {
                label: 'Mes',
                value: resumenAsistencias.totalAsistencias.toString(),
                helper: `Asistencias en ${mesReferencia}.`
              },
              {
                label: 'Socios unicos',
                value: resumenAsistencias.sociosUnicos.toString(),
                helper: 'Socios que asistieron este mes.'
              },
              {
                label: 'Promedio diario',
                value: resumenAsistencias.promedioDiario.toString(),
                helper: 'Asistencias promedio por dia.'
              }
            ];

            const pagosMetrics: DashboardMetricCardViewModel[] = [
              {
                label: 'Hoy',
                value: pagosHoy.length.toString(),
                helper: formatCurrency(montoCobradoHoy)
              },
              {
                label: 'Mes',
                value: pagosMes.length.toString(),
                helper: formatCurrency(montoCobradoMes)
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
                helper: 'Registros devueltos por la API del dia actual.'
              },
              {
                label: 'Pagos registrados',
                value: pagos.length.toString(),
                helper: 'Cantidad total de pagos cargados en backend.'
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
              totalSocios: socios.length,
              sociosActivos,
              sociosInactivos,
              membresiasActivas,
              membresiasPendientesPago,
              membresiasVencidas,
              membresiasCanceladas,
              asistenciasHoy: asistencias.length,
              totalPagos: pagos.length,
              montoTotalCobrado,
              pagosHoy: pagosHoy.length,
              montoCobradoHoy,
              pagosMes: pagosMes.length,
              montoCobradoMes,
              asistenciasMes: resumenAsistencias.totalAsistencias,
              sociosUnicosAsistenciaMes: resumenAsistencias.sociosUnicos,
              promedioDiarioAsistenciasMes: resumenAsistencias.promedioDiario,
              asistenciasAbiertasHoy,
              membresiasPorVencer,
              membresiasConDeuda,
              ultimosPagos,
              ultimasAsistencias,
              topSociosAsistencias: resumenAsistencias.topSocios,
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
