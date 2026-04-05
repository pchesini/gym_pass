package com.gympass.gym_pass_backend.pago.dto;

import com.gympass.gym_pass_backend.pago.MetodoPago;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PagoCrearRequest {

    private Long socioId;
    private Long membresiaId;
    private LocalDateTime fechaPago;
    private BigDecimal monto;
    private MetodoPago metodoPago;
    private String observaciones;
    private Long promocionId;
    private Long registradoPorUsuarioId;
}
