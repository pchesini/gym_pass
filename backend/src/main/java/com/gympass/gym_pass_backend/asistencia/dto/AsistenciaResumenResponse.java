package com.gympass.gym_pass_backend.asistencia.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class AsistenciaResumenResponse {

    private LocalDate fechaDesde;
    private LocalDate fechaHasta;
    private long totalAsistencias;
    private long sociosUnicos;
    private BigDecimal promedioDiario = BigDecimal.ZERO;
    private List<TopSocioAsistenciaResponse> topSocios = new ArrayList<>();
    private List<DistribucionAsistenciaResponse> asistenciasPorDia = new ArrayList<>();
    private List<DistribucionAsistenciaResponse> asistenciasPorFranjaHoraria = new ArrayList<>();
    private List<DistribucionAsistenciaResponse> asistenciasPorDiaYFranja = new ArrayList<>();
}
