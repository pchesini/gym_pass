package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;

public class MembresiaMapper {

    private MembresiaMapper() {
        
    }

    public static MembresiaEntity fromCrearRequest(MembresiaCrearRequest request) {
        return MembresiaEntity.builder()
                .fechaInicio(request.getFechaInicio())
                .fechaVencimiento(request.getFechaVencimiento())
                //.estado(request.getEstado())
                .precioLista(request.getPrecioLista())
                .saldoPendiente(request.getSaldoPendiente())
                .build();
    }

    public static MembresiaResponse toResponse(MembresiaEntity entity) {
        MembresiaResponse dto = new MembresiaResponse();
        dto.setId(entity.getId());
        dto.setSocioId(entity.getSocio() != null ? entity.getSocio().getId() : null);
        dto.setFechaInicio(entity.getFechaInicio());
        dto.setFechaVencimiento(entity.getFechaVencimiento());
        dto.setEstado(entity.getEstado());
        dto.setPrecioLista(entity.getPrecioLista());
        dto.setSaldoPendiente(entity.getSaldoPendiente());
        return dto;
    }
}
