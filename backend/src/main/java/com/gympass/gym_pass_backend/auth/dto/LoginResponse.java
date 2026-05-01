package com.gympass.gym_pass_backend.auth.dto;

import com.gympass.gym_pass_backend.usuario.RolUsuario;

public record LoginResponse(
        String token,
        String username,
        RolUsuario rol
) {
}
