package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaAccesoBloqueadoResponse;
import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class AsistenciaAccesoBloqueadoException extends RuntimeException {

    private final Long socioId;
    private final String socioNombre;
    private final Long membresiaId;
    private final EstadoMembresia estadoMembresia;
    private final LocalDate fechaVencimiento;
    private final BigDecimal saldoPendiente;
    private final boolean membresiaVencida;
    private final boolean tieneSaldoPendiente;

    public AsistenciaAccesoBloqueadoException(
            String message,
            Long socioId,
            String socioNombre,
            Long membresiaId,
            EstadoMembresia estadoMembresia,
            LocalDate fechaVencimiento,
            BigDecimal saldoPendiente,
            boolean membresiaVencida,
            boolean tieneSaldoPendiente
    ) {
        super(message);
        this.socioId = socioId;
        this.socioNombre = socioNombre;
        this.membresiaId = membresiaId;
        this.estadoMembresia = estadoMembresia;
        this.fechaVencimiento = fechaVencimiento;
        this.saldoPendiente = saldoPendiente;
        this.membresiaVencida = membresiaVencida;
        this.tieneSaldoPendiente = tieneSaldoPendiente;
    }

    public AsistenciaAccesoBloqueadoResponse toResponse() {
        AsistenciaAccesoBloqueadoResponse response = new AsistenciaAccesoBloqueadoResponse();
        response.setMessage(getMessage());
        response.setSocioId(socioId);
        response.setSocioNombre(socioNombre);
        response.setMembresiaId(membresiaId);
        response.setEstadoMembresia(estadoMembresia);
        response.setFechaVencimiento(fechaVencimiento);
        response.setSaldoPendiente(saldoPendiente);
        response.setMembresiaVencida(membresiaVencida);
        response.setTieneSaldoPendiente(tieneSaldoPendiente);
        return response;
    }
}
