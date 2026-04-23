package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaQrRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaQrResponse;
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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class AsistenciaService {

    private static final Pattern QR_CODE_PATTERN = Pattern.compile("S-[A-Z0-9]+");

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

        validarIngresoSocio(socio);

        AsistenciaEntity guardada = guardarEntrada(socio, request);
        return AsistenciaMapper.toResponse(guardada);
    }

    public AsistenciaQrResponse registrarEntradaPorQr(AsistenciaQrRequest request) {
        String qrCode = normalizarQrCode(request.getQrCode());

        if (qrCode == null || qrCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo QR es obligatorio");
        }

        SocioEntity socio = socioRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe un socio para el QR informado"));

        validarIngresoSocio(socio);

        AsistenciaCrearRequest asistenciaRequest = new AsistenciaCrearRequest();
        asistenciaRequest.setSocioId(socio.getId());
        asistenciaRequest.setCredencialId(socio.getId());
        asistenciaRequest.setFechaHoraEntrada(LocalDateTime.now());
        asistenciaRequest.setTipoRegistro(TipoRegistroAsistencia.STAFF);

        AsistenciaEntity guardada = guardarEntrada(socio, asistenciaRequest);

        AsistenciaQrResponse response = new AsistenciaQrResponse();
        response.setAsistenciaId(guardada.getId());
        response.setSocioId(socio.getId());
        response.setNombreSocio(socio.getNombreCompleto());
        response.setQrCode(socio.getQrCode());
        response.setAccion("ENTRADA_REGISTRADA");
        response.setMensaje("Entrada registrada correctamente");
        response.setFechaHoraEntrada(guardada.getFechaHoraEntrada());
        return response;
    }

    private String normalizarQrCode(String rawQrCode) {
        if (rawQrCode == null) {
            return null;
        }

        String normalizedValue = rawQrCode.trim().toUpperCase();
        if (normalizedValue.isBlank()) {
            return null;
        }

        Matcher matcher = QR_CODE_PATTERN.matcher(normalizedValue);
        if (matcher.find()) {
            return matcher.group();
        }

        return normalizedValue;
    }

    private void validarIngresoSocio(SocioEntity socio) {

        if (socio.getEstado() != EstadoSocio.ACTIVO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no esta activo");
        }

        List<MembresiaEntity> membresias = membresiaRepository.findBySocioId(socio.getId());

        if (membresias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no tiene una membresia vigente");
        }

        boolean permiteIngreso = membresias.stream()
                .anyMatch(membresiaEstadoResolver::permiteIngreso);

        if (!permiteIngreso) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El socio no tiene una membresia vigente habilitada para registrar asistencia"
            );
        }

        asistenciaRepository.findFirstBySocioIdAndFechaHoraSalidaIsNull(socio.getId())
                .ifPresent(asistencia -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio ya tiene una asistencia abierta");
                });
    }

    private AsistenciaEntity guardarEntrada(SocioEntity socio, AsistenciaCrearRequest request) {
        AsistenciaEntity entity = AsistenciaMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        if (entity.getFechaHoraEntrada() == null) {
            entity.setFechaHoraEntrada(LocalDateTime.now());
        }

        return asistenciaRepository.save(entity);
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
}
