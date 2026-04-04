package com.gympass.gym_pass_backend.membresia.dto;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MembresiaEstadoRequest {

    private EstadoMembresia estado;
}
