package com.gympass.gym_pass_backend.membresia.dto;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class MembresiaActualizarRequest {

    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private EstadoMembresia estado;
    private BigDecimal precioLista;
    private BigDecimal saldoPendiente;
}
