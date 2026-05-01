package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaResponse;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaEstadoResolver;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.socio.EstadoSocio;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepository;
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final MembresiaEstadoResolver membresiaEstadoResolver;

    public AsistenciaService(
            AsistenciaRepository asistenciaRepository,
            SocioRepository socioRepository,
            MembresiaRepository membresiaRepository,
            MembresiaEstadoResolver membresiaEstadoResolver
    ) {
        this.asistenciaRepository = asistenciaRepository;
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.membresiaEstadoResolver = membresiaEstadoResolver;
    }

    public AsistenciaResponse registrarEntrada(AsistenciaCrearRequest request) {
        if (request.getCredencialId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La credencial es obligatoria");
        }
        if (request.getSocioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio es obligatorio");
        }

        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        if (socio.getEstado() != EstadoSocio.ACTIVO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no esta activo");
        }

        List<MembresiaEntity> membresias = membresiaRepository.findBySocioId(request.getSocioId());

        if (membresias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no tiene una membresia vigente");
        }

        boolean permiteIngreso = membresias.stream()
                .anyMatch(membresiaEstadoResolver::permiteIngreso);

        if (!permiteIngreso) {
            throw construirAccesoBloqueado(socio, membresias);
        }

        asistenciaRepository.findFirstBySocioIdAndFechaHoraSalidaIsNull(request.getSocioId())
                .ifPresent(asistencia -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio ya tiene una asistencia abierta");
                });

        AsistenciaEntity entity = AsistenciaMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        if (entity.getFechaHoraEntrada() == null) {
            entity.setFechaHoraEntrada(LocalDateTime.now());
        }

        AsistenciaEntity guardada = asistenciaRepository.save(entity);
        return AsistenciaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public AsistenciaResponse obtenerPorId(Long id) {
        AsistenciaEntity entity = asistenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asistencia no encontrada"));
        return AsistenciaMapper.toResponse(entity);
    }

    public AsistenciaResponse registrarSalida(Long asistenciaId) {
            AsistenciaEntity entity = asistenciaRepository.findById(asistenciaId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asistencia no encontrada"));

            if (entity.getFechaHoraSalida() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La asistencia ya fue cerrada");
            }

            if (entity.getFechaHoraEntrada() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La asistencia no tiene fecha de entrada registrada");
            }

            LocalDateTime fechaHoraSalida = LocalDateTime.now();
            entity.setFechaHoraSalida(fechaHoraSalida);
            entity.setDuracionMinutos((int) Duration.between(entity.getFechaHoraEntrada(), fechaHoraSalida).toMinutes());

            AsistenciaEntity actualizada = asistenciaRepository.save(entity);
            return AsistenciaMapper.toResponse(actualizada);
        }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        return asistenciaRepository.findBySocioId(socioId).stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarAsistenciasDeHoy() {
        return asistenciaRepository.buscarAsistenciasDeHoy().stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarAsistenciasPorFecha(LocalDate fecha) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        return asistenciaRepository.findByFechaHoraEntradaBetween(
                        fechaConsulta.atStartOfDay(),
                        fechaConsulta.plusDays(1).atStartOfDay()
                ).stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    private void validarSocioExiste(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
        }
    }

    private AsistenciaAccesoBloqueadoException construirAccesoBloqueado(
            SocioEntity socio,
            List<MembresiaEntity> membresias
    ) {
        MembresiaEntity membresiaReferencia = membresias.stream()
                .max(Comparator.comparing(
                        MembresiaEntity::getFechaVencimiento,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);

        EstadoMembresia estadoMembresia = membresiaReferencia != null
                ? membresiaEstadoResolver.resolveEstadoAutomatico(membresiaReferencia)
                : null;
        BigDecimal saldoPendiente = membresiaReferencia != null && membresiaReferencia.getSaldoPendiente() != null
                ? membresiaReferencia.getSaldoPendiente()
                : BigDecimal.ZERO;
        boolean membresiaVencida = estadoMembresia == EstadoMembresia.VENCIDA;
        boolean tieneSaldoPendiente = saldoPendiente.compareTo(BigDecimal.ZERO) > 0;

        return new AsistenciaAccesoBloqueadoException(
                construirMensajeBloqueo(membresiaVencida, tieneSaldoPendiente),
                socio.getId(),
                socio.getNombreCompleto(),
                membresiaReferencia != null ? membresiaReferencia.getId() : null,
                estadoMembresia,
                membresiaReferencia != null ? membresiaReferencia.getFechaVencimiento() : null,
                saldoPendiente,
                membresiaVencida,
                tieneSaldoPendiente
        );
    }

    private String construirMensajeBloqueo(boolean membresiaVencida, boolean tieneSaldoPendiente) {
        if (membresiaVencida && tieneSaldoPendiente) {
            return "No se puede registrar asistencia porque la membresia esta vencida y registra saldo pendiente";
        }
        if (membresiaVencida) {
            return "No se puede registrar asistencia porque la membresia esta vencida";
        }
        if (tieneSaldoPendiente) {
            return "No se puede registrar asistencia porque la membresia registra saldo pendiente";
        }
        return "El socio no tiene una membresia habilitada para registrar asistencia";
    }
}
