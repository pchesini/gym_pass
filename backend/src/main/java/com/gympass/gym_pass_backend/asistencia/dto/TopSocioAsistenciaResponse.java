package com.gympass.gym_pass_backend.asistencia.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TopSocioAsistenciaResponse {

    private Long socioId;
    private String socioNombre;
    private String socioDni;
    private long cantidadAsistencias;
}
