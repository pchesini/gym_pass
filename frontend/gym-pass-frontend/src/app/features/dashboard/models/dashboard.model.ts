import { MembresiaViewModel } from '../../membresias/models/membresia.model';
import {
  AsistenciaResumenApiResponse,
  AsistenciaViewModel,
  TopSocioAsistenciaApiResponse
} from '../../asistencias/models/asistencia.model';
import { PagoViewModel } from '../../pagos/models/pago.model';
import { SocioViewModel } from '../../socios/models/socio.model';

export interface DashboardMetricCardViewModel {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardMetricGroupViewModel {
  title: string;
  icon: string;
  metrics: DashboardMetricCardViewModel[];
}

export interface DashboardSummaryViewModel {
  mesReferencia: string;
  totalSocios: number;
  sociosActivos: number;
  sociosInactivos: number;
  membresiasActivas: number;
  membresiasPendientesPago: number;
  membresiasVencidas: number;
  membresiasCanceladas: number;
  asistenciasHoy: number;
  totalPagos: number;
  montoTotalCobrado: number;
  pagosHoy: number;
  montoCobradoHoy: number;
  pagosMes: number;
  montoCobradoMes: number;
  asistenciasMes: number;
  sociosUnicosAsistenciaMes: number;
  promedioDiarioAsistenciasMes: number;
  asistenciasAbiertasHoy: number;
  membresiasPorVencer: MembresiaViewModel[];
  membresiasConDeuda: MembresiaViewModel[];
  ultimosPagos: PagoViewModel[];
  ultimasAsistencias: AsistenciaViewModel[];
  topSociosAsistencias: TopSocioAsistenciaApiResponse[];
  resumenAsistencias: AsistenciaResumenApiResponse;
  sociosRecientes: SocioViewModel[];
  metrics: DashboardMetricCardViewModel[];
  metricGroups: DashboardMetricGroupViewModel[];
}
