package com.gympass.gym_pass_backend.socio;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SocioRepository extends JpaRepository<SocioEntity, Long> {

    Optional<SocioEntity> findByDni(String dni);

    Optional<SocioEntity> findByEmail(String email);

    List<SocioEntity> findByEstado(EstadoSocio estado);

    // BUSCADOR GENERAL (nombre, dni o email)
    @Query("""
        SELECT s FROM SocioEntity s
        WHERE 
            LOWER(s.nombreCompleto) LIKE LOWER(CONCAT('%', :texto, '%')) OR
            LOWER(s.dni) LIKE LOWER(CONCAT('%', :texto, '%')) OR
            LOWER(s.email) LIKE LOWER(CONCAT('%', :texto, '%'))
    """)
    List<SocioEntity> buscarPorTexto(@Param("texto") String texto);
}
