package com.gympass.gym_pass_backend.auth;

import com.gympass.gym_pass_backend.auth.dto.LoginRequest;
import com.gympass.gym_pass_backend.auth.dto.LoginResponse;
import com.gympass.gym_pass_backend.usuario.UsuarioEntity;
import com.gympass.gym_pass_backend.usuario.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        UsuarioEntity usuario = usuarioRepository.findByUsername(request.username())
                .filter(UsuarioEntity::getActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas."));

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas.");
        }

        String token = jwtService.generarToken(usuario);
        return new LoginResponse(token, usuario.getUsername(), usuario.getRol());
    }
}
