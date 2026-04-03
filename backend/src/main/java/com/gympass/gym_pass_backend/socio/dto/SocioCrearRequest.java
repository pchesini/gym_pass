package com.gympass.gym_pass_backend.socio.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SocioCrearRequest {

    private String nombreCompleto;
    private String dni;
    private String email;
    private String telefono;
    private Long planId;
    private LocalDate fechaNacimiento;

}
