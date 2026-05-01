package com.gympass.gym_pass_backend.pago.dto;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class DeudorResponse {

    private Long socioId;
    private String socioNombre;
    private String socioDni;
    private Long membresiaId;
    private LocalDate fechaVencimiento;
    private EstadoMembresia estadoMembresia;
    private BigDecimal saldoPendiente;
}
