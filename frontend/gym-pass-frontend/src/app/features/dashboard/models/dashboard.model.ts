import { MembresiaViewModel } from '../../membresias/models/membresia.model';
import {
  AsistenciaResumenApiResponse,
  AsistenciaViewModel,
  DistribucionAsistenciaApiResponse,
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
  mesAnteriorReferencia: string;
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
  asistenciasMesAnterior: number;
  sociosUnicosAsistenciaMesAnterior: number;
  asistenciasAbiertasHoy: number;
  membresiasPorVencer: MembresiaViewModel[];
  membresiasConDeuda: MembresiaViewModel[];
  ultimosPagos: PagoViewModel[];
  ultimasAsistencias: AsistenciaViewModel[];
  topSociosAsistencias: TopSocioAsistenciaApiResponse[];
  sociosMenosAsistencias: TopSocioAsistenciaApiResponse[];
  diasAsistencia: string[];
  franjasAsistencia: string[];
  asistenciasPorDia: DistribucionAsistenciaApiResponse[];
  asistenciasPorFranjaHoraria: DistribucionAsistenciaApiResponse[];
  asistenciasPorDiaYFranja: DistribucionAsistenciaApiResponse[];
  maxAsistenciasPorCelda: number;
  maxAsistenciasPorFranja: number;
  resumenAsistencias: AsistenciaResumenApiResponse;
  sociosRecientes: SocioViewModel[];
  metrics: DashboardMetricCardViewModel[];
  metricGroups: DashboardMetricGroupViewModel[];
}
