package com.gympass.gym_pass_backend.usuario;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UsuarioInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        crearUsuarioSiNoExiste("admin", "admin123", RolUsuario.ADMIN);
        crearUsuarioSiNoExiste("staff", "staff123", RolUsuario.STAFF);
    }

    private void crearUsuarioSiNoExiste(String username, String password, RolUsuario rol) {
        if (usuarioRepository.existsByUsername(username)) {
            return;
        }

        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setUsername(username);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRol(rol);
        usuario.setActivo(true);

        usuarioRepository.save(usuario);
    }
}
