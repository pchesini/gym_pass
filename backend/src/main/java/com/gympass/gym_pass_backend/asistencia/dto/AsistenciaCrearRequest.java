package com.gympass.gym_pass_backend.asistencia.dto;

import com.gympass.gym_pass_backend.asistencia.TipoRegistroAsistencia;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AsistenciaCrearRequest {

    private Long socioId;
    private Long credencialId;
    private LocalDateTime fechaHoraEntrada;
    private TipoRegistroAsistencia tipoRegistro;
    private Long registradoPorUsuarioId;
}
