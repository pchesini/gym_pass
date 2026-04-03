package com.gympass.gym_pass_backend.socio.dto;

import com.gympass.gym_pass_backend.socio.EstadoSocio;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SocioResponse {

    private Long id;
    private String nombreCompleto;
    private String dni;
    private String email;
    private String telefono;
    private EstadoSocio estado;
    private LocalDate fechaNacimiento;
    ;
}
