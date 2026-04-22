package com.gympass.gym_pass_backend.membresia;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class MembresiaEstadoResolver {

    public EstadoMembresia resolveEstadoAutomatico(MembresiaEntity entity) {
        if (entity.getEstado() == EstadoMembresia.CANCELADA) {
            return EstadoMembresia.CANCELADA;
        }

        if (entity.getFechaVencimiento() != null && entity.getFechaVencimiento().isBefore(LocalDate.now())) {
            return EstadoMembresia.VENCIDA;
        }

        if (entity.getSaldoPendiente() != null && entity.getSaldoPendiente().compareTo(BigDecimal.ZERO) > 0) {
            return EstadoMembresia.PENDIENTE_PAGO;
        }

        return EstadoMembresia.ACTIVA;
    }

    public boolean estaActiva(MembresiaEntity entity) {
        return resolveEstadoAutomatico(entity) == EstadoMembresia.ACTIVA;
    }

    public boolean permiteIngreso(MembresiaEntity entity) {
        EstadoMembresia estado = resolveEstadoAutomatico(entity);
        return estado == EstadoMembresia.ACTIVA || estado == EstadoMembresia.PENDIENTE_PAGO;
    }
}
