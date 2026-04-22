package com.gympass.gym_pass_backend.socio;

import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaEstadoResolver;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.socio.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SocioService {

    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final MembresiaEstadoResolver membresiaEstadoResolver;

    public SocioService(
            SocioRepository socioRepository,
            MembresiaRepository membresiaRepository,
            MembresiaEstadoResolver membresiaEstadoResolver
    ) {
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.membresiaEstadoResolver = membresiaEstadoResolver;
    }

    public SocioResponse crearSocio(SocioCrearRequest request) {
        // Validar DNI duplicado (fuerte)
        socioRepository.findByDni(request.getDni()).ifPresent(s -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El DNI ya está registrado");
        });

        SocioEntity entity = SocioMapper.fromCrearRequest(request);
        entity.setEstado(EstadoSocio.ACTIVO);
        entity.setFechaAlta(java.time.LocalDate.now());
        // más adelante esto vendrá de la membresía activa
        //entity.setFechaVencimiento(null);
        entity.setQrCode(generarCodigoQr());

        SocioEntity guardado = socioRepository.save(entity);
        return SocioMapper.toResponse(guardado);
    }

    public List<SocioResponse> listarSocios(EstadoSocio estado, Boolean vencidos, String busqueda) {
        List<SocioEntity> socios;

        if (busqueda != null && !busqueda.isBlank()) {
            socios = socioRepository.buscarPorTexto(busqueda);
        } else if (estado != null) {
            socios = socioRepository.findByEstado(estado);
        } else {
            socios = socioRepository.findAll();
        }

        

        if (vencidos != null) {
            socios = socios.stream()
                    .filter(socio -> esSocioVencido(socio) == vencidos)
                    .collect(Collectors.toList());
        }

        return socios.stream()
                .map(SocioMapper::toResponse)
                .collect(Collectors.toList());
    }

    public SocioResponse obtenerPorId(Long id) {
        SocioEntity entity = socioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));
        return SocioMapper.toResponse(entity);
    }

    public SocioResponse actualizarSocio(Long id, SocioActualizarRequest request) {
        SocioEntity entity = socioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        if (request.getNombreCompleto() != null) {
            entity.setNombreCompleto(request.getNombreCompleto());
        }
        if (request.getEmail() != null) {
            entity.setEmail(request.getEmail());
        }
        if (request.getTelefono() != null) {
            entity.setTelefono(request.getTelefono());
        }
        if (request.getFechaNacimiento() != null) {
            entity.setFechaNacimiento(request.getFechaNacimiento());
        }

        // planId se va a usar cuando integre Planes/Membresías

        SocioEntity actualizado = socioRepository.save(entity);
        return SocioMapper.toResponse(actualizado);
    }

    public SocioResponse cambiarEstado(Long id, SocioEstadoRequest request) {
        SocioEntity entity = socioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        entity.setEstado(request.getEstado());
        SocioEntity actualizado = socioRepository.save(entity);
        return SocioMapper.toResponse(actualizado);
    }

    public SocioQrResponse obtenerQr(Long id) {
        SocioEntity entity = socioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        String baseUrl = "https://mi-gym.com/qr/"; // placeholder, después lo cambio

        SocioQrResponse dto = new SocioQrResponse();
        dto.setQr(entity.getQrCode());
        dto.setUrl(baseUrl + entity.getQrCode());
        return dto;
    }

    private String generarCodigoQr() {
        // Formato simple: S-ABCDEFGH
        String random = UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
        return "S-" + random;
    }

    private boolean esSocioVencido(SocioEntity socio) {
        List<MembresiaEntity> membresias = membresiaRepository.findBySocioId(socio.getId());

        if (membresias.isEmpty()) {
            return true;
        }

        return membresias.stream()
                .noneMatch(membresiaEstadoResolver::estaActiva);
    }
}
