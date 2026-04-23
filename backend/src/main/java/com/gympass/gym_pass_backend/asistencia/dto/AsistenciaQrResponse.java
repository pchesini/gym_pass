package com.gympass.gym_pass_backend.asistencia.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AsistenciaQrResponse {

    private Long asistenciaId;
    private Long socioId;
    private String nombreSocio;
    private String qrCode;
    private String accion;
    private String mensaje;
    private LocalDateTime fechaHoraEntrada;
}
