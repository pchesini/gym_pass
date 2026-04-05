package com.gympass.gym_pass_backend.pago;

import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.pago.dto.PagoResponse;

public class PagoMapper {

    private PagoMapper() {
        // Clase de utilidad, no se instancia
    }

    public static PagoEntity fromCrearRequest(PagoCrearRequest request) {
        return PagoEntity.builder()
                .fechaPago(request.getFechaPago())
                .monto(request.getMonto())
                .metodoPago(request.getMetodoPago())
                .observaciones(request.getObservaciones())
                .promocionId(request.getPromocionId())
                .registradoPorUsuarioId(request.getRegistradoPorUsuarioId())
                .build();
    }

    public static PagoResponse toResponse(PagoEntity entity) {
        PagoResponse dto = new PagoResponse();
        dto.setId(entity.getId());
        dto.setSocioId(entity.getSocio() != null ? entity.getSocio().getId() : null);
        dto.setMembresiaId(entity.getMembresia() != null ? entity.getMembresia().getId() : null);
        dto.setFechaPago(entity.getFechaPago());
        dto.setMonto(entity.getMonto());
        dto.setMetodoPago(entity.getMetodoPago());
        dto.setObservaciones(entity.getObservaciones());
        dto.setPromocionId(entity.getPromocionId());
        dto.setRegistradoPorUsuarioId(entity.getRegistradoPorUsuarioId());
        return dto;
    }
}
