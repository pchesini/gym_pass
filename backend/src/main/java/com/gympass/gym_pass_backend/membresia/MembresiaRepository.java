package com.gympass.gym_pass_backend.membresia;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface MembresiaRepository extends JpaRepository<MembresiaEntity, Long> {

    List<MembresiaEntity> findBySocioId(Long socioId);

    List<MembresiaEntity> findByEstado(EstadoMembresia estado);

    List<MembresiaEntity> findBySocioIdAndEstado(Long socioId, EstadoMembresia estado);

    Optional<MembresiaEntity> findFirstBySocioIdAndEstadoOrderByFechaVencimientoDesc(Long socioId, EstadoMembresia estado);
}
