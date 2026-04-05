package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaResponse;

public class AsistenciaMapper {

    private AsistenciaMapper() {
        // Clase de utilidad, no se instancia
    }

    public static AsistenciaEntity fromCrearRequest(AsistenciaCrearRequest request) {
        return AsistenciaEntity.builder()
                .credencialId(request.getCredencialId())
                .fechaHoraEntrada(request.getFechaHoraEntrada())
                .tipoRegistro(request.getTipoRegistro())
                .registradoPorUsuarioId(request.getRegistradoPorUsuarioId())
                .build();
    }

    public static AsistenciaResponse toResponse(AsistenciaEntity entity) {
        AsistenciaResponse dto = new AsistenciaResponse();
        dto.setId(entity.getId());
        dto.setSocioId(entity.getSocio() != null ? entity.getSocio().getId() : null);
        dto.setCredencialId(entity.getCredencialId());
        dto.setFechaHoraEntrada(entity.getFechaHoraEntrada());
        dto.setFechaHoraSalida(entity.getFechaHoraSalida());
        dto.setDuracionMinutos(entity.getDuracionMinutos());
        dto.setTipoRegistro(entity.getTipoRegistro());
        dto.setRegistradoPorUsuarioId(entity.getRegistradoPorUsuarioId());
        return dto;
    }
}
