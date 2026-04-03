package com.gympass.gym_pass_backend.socio;

import com.gympass.gym_pass_backend.socio.dto.SocioCrearRequest;
import com.gympass.gym_pass_backend.socio.dto.SocioResponse;

public class SocioMapper {

    private SocioMapper() {
        // Clase de utilidad, no se instancia
    }

    public static SocioEntity fromCrearRequest(SocioCrearRequest request) {
        return SocioEntity.builder()
                .nombreCompleto(request.getNombreCompleto())
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .fechaNacimiento(request.getFechaNacimiento())
                .build();
    }


    public static SocioResponse toResponse(SocioEntity entity) {
        SocioResponse dto = new SocioResponse();
        dto.setId(entity.getId());
        dto.setNombreCompleto(entity.getNombreCompleto());
        dto.setDni(entity.getDni());
        dto.setEmail(entity.getEmail());
        dto.setTelefono(entity.getTelefono());
        dto.setEstado(entity.getEstado());
        dto.setFechaNacimiento(entity.getFechaNacimiento());
        return dto;
    }
}
