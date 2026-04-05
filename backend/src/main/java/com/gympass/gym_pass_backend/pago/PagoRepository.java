package com.gympass.gym_pass_backend.pago;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PagoRepository extends JpaRepository<PagoEntity, Long> {

    List<PagoEntity> findBySocioId(Long socioId);

    List<PagoEntity> findByMembresiaId(Long membresiaId);

    List<PagoEntity> findByFechaPagoBetween(LocalDateTime fechaDesde, LocalDateTime fechaHasta);
}
