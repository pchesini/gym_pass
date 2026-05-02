package com.gympass.gym_pass_backend.asistencia.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DistribucionAsistenciaResponse {

    private String dia;
    private String franja;
    private long cantidad;
}
