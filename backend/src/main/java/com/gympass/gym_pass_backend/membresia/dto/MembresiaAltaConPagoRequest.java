package com.gympass.gym_pass_backend.membresia.dto;

import com.gympass.gym_pass_backend.pago.MetodoPago;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class MembresiaAltaConPagoRequest {

    private Long socioId;
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private BigDecimal precioLista;
    private BigDecimal montoPagado;
    private MetodoPago metodoPago;
    private String observacionesPago;
}
