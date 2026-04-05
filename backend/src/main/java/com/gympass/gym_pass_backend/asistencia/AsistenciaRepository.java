package com.gympass.gym_pass_backend.asistencia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends JpaRepository<AsistenciaEntity, Long> {

    List<AsistenciaEntity> findBySocioId(Long socioId);

    List<AsistenciaEntity> findByFechaHoraEntradaBetween(LocalDateTime fechaDesde, LocalDateTime fechaHasta);

    @Query(value = """
        SELECT *
        FROM asistencias a
        WHERE a.fecha_hora_entrada >= CURRENT_DATE
          AND a.fecha_hora_entrada < CURRENT_DATE + INTERVAL '1 day'
    """, nativeQuery = true)
    List<AsistenciaEntity> buscarAsistenciasDeHoy();
    // Método para buscar asistencias de un socio específico en un rango de fechas que me va a servir para reortes y para el portal de socio.
    List<AsistenciaEntity> findBySocioIdAndFechaHoraEntradaBetween(Long socioId, LocalDateTime fechaDesde, LocalDateTime fechaHasta);

    Optional<AsistenciaEntity> findFirstBySocioIdAndFechaHoraSalidaIsNull(Long socioId);
}
