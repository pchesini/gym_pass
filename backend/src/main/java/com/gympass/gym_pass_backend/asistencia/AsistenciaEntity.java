package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.socio.SocioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "asistencias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsistenciaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // esta entidad es se va a migrar a persona despues 
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id", nullable = false)
    private SocioEntity socio;

    @Column(name = "credencial_id", nullable = false)
    private Long credencialId;

    @Column(name = "fecha_hora_entrada", nullable = false)
    private LocalDateTime fechaHoraEntrada;

    // Puede quedar null si el socio no marco salida.
    // Luego puede cerrarse manualmente desde el sistema.
    // Mas adelante podra existir un cierre automatico al final del dia.
    @Column(name = "fecha_hora_salida")
    private LocalDateTime fechaHoraSalida;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_registro", nullable = false, length = 20)
    private TipoRegistroAsistencia tipoRegistro;

    @Column(name = "registrado_por_usuario_id")
    private Long registradoPorUsuarioId;
}
