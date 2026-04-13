import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';

import { AsistenciasService } from '../../asistencias/services/asistencias.service';
import { PagosService } from '../../pagos/services/pagos.service';
import { SociosService } from '../../socios/services/socios.service';
import {
  DashboardMetricCardViewModel,
  DashboardSummaryViewModel
} from '../models/dashboard.model';

function isSameDay(dateValue: string | null | undefined, todayIso: string): boolean {
  return !!dateValue && dateValue.slice(0, 10) === todayIso;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly sociosService = inject(SociosService);
  private readonly asistenciasService = inject(AsistenciasService);
  private readonly pagosService = inject(PagosService);

  getDashboardSummary(): Observable<DashboardSummaryViewModel> {
    return this.sociosService.getSocios().pipe(
      map((socios) => {
        const sortedSocios = [...socios].sort((left, right) => right.id - left.id);
        return {
          socios,
          sociosRecientes: sortedSocios.slice(0, 5),
          todayIso: new Date().toISOString().slice(0, 10),
          sociosActivos: socios.filter((socio) => socio.estado === 'ACTIVO').length,
          sociosInactivos: socios.filter((socio) => socio.estado === 'INACTIVO').length
        };
      }),
      switchMap(({ socios, sociosRecientes, todayIso, sociosActivos, sociosInactivos }) =>
        forkJoin({
          asistencias: this.asistenciasService.getAsistenciasHoy(socios),
          pagos: this.pagosService.getPagos(socios)
        }).pipe(
          map(({ asistencias, pagos }) => {
            const pagosHoy = pagos.filter((pago) => isSameDay(pago.fechaPago, todayIso));
            const montoTotalCobrado = pagos.reduce((total, pago) => total + pago.monto, 0);
            const montoCobradoHoy = pagosHoy.reduce((total, pago) => total + pago.monto, 0);
            const ultimosPagos = [...pagos]
              .sort((left, right) => (right.fechaPago ?? '').localeCompare(left.fechaPago ?? ''))
              .slice(0, 5);
            const ultimasAsistencias = [...asistencias]
              .sort((left, right) => (right.fechaHoraEntrada ?? '').localeCompare(left.fechaHoraEntrada ?? ''))
              .slice(0, 5);

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
              totalSocios: socios.length,
              sociosActivos,
              sociosInactivos,
              asistenciasHoy: asistencias.length,
              totalPagos: pagos.length,
              montoTotalCobrado,
              pagosHoy: pagosHoy.length,
              montoCobradoHoy,
              ultimosPagos,
              ultimasAsistencias,
              sociosRecientes,
              metrics
            };
          })
        )
      )
    );
  }
}
