package com.gympass.gym_pass_backend.asistencia.dto;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AsistenciaAccesoBloqueadoResponse {

    private String message;
    private Long socioId;
    private String socioNombre;
    private Long membresiaId;
    private EstadoMembresia estadoMembresia;
    private LocalDate fechaVencimiento;
    private BigDecimal saldoPendiente;
    private boolean membresiaVencida;
    private boolean tieneSaldoPendiente;
}
