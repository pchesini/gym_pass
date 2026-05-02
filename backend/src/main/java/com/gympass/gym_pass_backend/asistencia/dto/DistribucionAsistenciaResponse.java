package com.gympass.gym_pass_backend.asistencia.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DistribucionAsistenciaResponse {

    private LocalDate fecha;
    private String dia;
    private String franja;
    private long cantidad;
}
