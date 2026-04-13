import { AsistenciaViewModel } from '../../asistencias/models/asistencia.model';
import { PagoViewModel } from '../../pagos/models/pago.model';
import { SocioViewModel } from '../../socios/models/socio.model';

export interface DashboardMetricCardViewModel {
  label: string;
  value: string;
  helper: string;
}

export interface DashboardSummaryViewModel {
  totalSocios: number;
  sociosActivos: number;
  sociosInactivos: number;
  asistenciasHoy: number;
  totalPagos: number;
  montoTotalCobrado: number;
  pagosHoy: number;
  montoCobradoHoy: number;
  ultimosPagos: PagoViewModel[];
  ultimasAsistencias: AsistenciaViewModel[];
  sociosRecientes: SocioViewModel[];
  metrics: DashboardMetricCardViewModel[];
}
