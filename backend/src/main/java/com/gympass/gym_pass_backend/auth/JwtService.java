package com.gympass.gym_pass_backend.auth;

import com.gympass.gym_pass_backend.usuario.RolUsuario;
import com.gympass.gym_pass_backend.usuario.UsuarioEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret:gym-pass-local-secret-key-change-me-2026}") String secret,
            @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String generarToken(UsuarioEntity usuario) {
        Instant ahora = Instant.now();
        Instant vencimiento = ahora.plusSeconds(expirationMinutes * 60);

        return Jwts.builder()
                .subject(usuario.getUsername())
                .claim("rol", usuario.getRol().name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(vencimiento))
                .signWith(secretKey)
                .compact();
    }

    public String obtenerUsername(String token) {
        return obtenerClaims(token).getSubject();
    }

    public RolUsuario obtenerRol(String token) {
        String rol = obtenerClaims(token).get("rol", String.class);
        return RolUsuario.valueOf(rol);
    }

    public boolean esTokenValido(String token) {
        obtenerClaims(token);
        return true;
    }

    private Claims obtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
