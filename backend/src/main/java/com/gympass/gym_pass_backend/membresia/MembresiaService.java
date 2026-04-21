package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaActualizarRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaAltaConPagoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaEstadoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;
import com.gympass.gym_pass_backend.pago.PagoEntity;
import com.gympass.gym_pass_backend.pago.PagoMapper;
import com.gympass.gym_pass_backend.pago.PagoRepository;
import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final SocioRepository socioRepository;
    private final PagoRepository pagoRepository;

    public MembresiaService(
            MembresiaRepository membresiaRepository,
            SocioRepository socioRepository,
            PagoRepository pagoRepository
    ) {
        this.membresiaRepository = membresiaRepository;
        this.socioRepository = socioRepository;
        this.pagoRepository = pagoRepository;
    }

    public MembresiaResponse crearMembresia(MembresiaCrearRequest request) {
        validarRangoFechas(request.getFechaInicio(), request.getFechaVencimiento());
        SocioEntity socio = obtenerSocioObligatorio(request.getSocioId());
        BigDecimal saldoPendiente = normalizeMoney(request.getSaldoPendiente());

        MembresiaEntity entity = MembresiaMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        entity.setPrecioLista(normalizeMoney(entity.getPrecioLista()));
        entity.setSaldoPendiente(saldoPendiente);
        entity.setEstado(definirEstadoInicial(saldoPendiente));
        syncEstado(entity);

        MembresiaEntity guardada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(guardada);
    }

    public MembresiaResponse crearMembresiaConPagoInicial(MembresiaAltaConPagoRequest request) {
        validarRangoFechas(request.getFechaInicio(), request.getFechaVencimiento());
        validarPagoInicial(request);

        SocioEntity socio = obtenerSocioObligatorio(request.getSocioId());
        BigDecimal precioLista = normalizeMoney(request.getPrecioLista());
        BigDecimal montoPagado = normalizeMoney(request.getMontoPagado());
        BigDecimal saldoPendiente = normalizeMoney(precioLista.subtract(montoPagado));

        MembresiaEntity membresia = MembresiaEntity.builder()
                .socio(socio)
                .fechaInicio(request.getFechaInicio())
                .fechaVencimiento(request.getFechaVencimiento())
                .precioLista(precioLista)
                .saldoPendiente(saldoPendiente)
                .estado(definirEstadoInicial(saldoPendiente))
                .build();
        syncEstado(membresia);

        MembresiaEntity guardada = membresiaRepository.save(membresia);

        PagoCrearRequest pagoRequest = new PagoCrearRequest();
        pagoRequest.setSocioId(socio.getId());
        pagoRequest.setMembresiaId(guardada.getId());
        pagoRequest.setFechaPago(LocalDateTime.now());
        pagoRequest.setMonto(montoPagado);
        pagoRequest.setMetodoPago(request.getMetodoPago());
        pagoRequest.setObservaciones(request.getObservacionesPago());

        PagoEntity pago = PagoMapper.fromCrearRequest(pagoRequest);
        pago.setSocio(socio);
        pago.setMembresia(guardada);
        pagoRepository.save(pago);

        return MembresiaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public MembresiaResponse obtenerPorId(Long id) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));
        syncEstado(entity);
        return MembresiaMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> listarTodas() {
        return membresiaRepository.findAllByOrderByFechaVencimientoDescIdDesc().stream()
                .map(this::syncEstado)
                .map(MembresiaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> listarPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        return membresiaRepository.findBySocioId(socioId).stream()
                .map(this::syncEstado)
                .map(MembresiaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MembresiaResponse obtenerActivaPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        MembresiaEntity entity = membresiaRepository.findBySocioId(socioId).stream()
                .map(this::syncEstado)
                .filter(membresia -> membresia.getEstado() == EstadoMembresia.ACTIVA)
                .sorted((left, right) -> {
                    LocalDate leftDate = left.getFechaVencimiento();
                    LocalDate rightDate = right.getFechaVencimiento();

                    if (leftDate == null && rightDate == null) {
                        return 0;
                    }
                    if (leftDate == null) {
                        return 1;
                    }
                    if (rightDate == null) {
                        return -1;
                    }

                    return rightDate.compareTo(leftDate);
                })
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia activa no encontrada"));

        return MembresiaMapper.toResponse(entity);
    }

    public MembresiaResponse actualizarMembresia(Long id, MembresiaActualizarRequest request) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

        validarRangoFechas(request.getFechaInicio(), request.getFechaVencimiento());

        if (request.getFechaInicio() != null) {
            entity.setFechaInicio(request.getFechaInicio());
        }
        if (request.getFechaVencimiento() != null) {
            entity.setFechaVencimiento(request.getFechaVencimiento());
        }
        if (request.getPrecioLista() != null) {
            entity.setPrecioLista(normalizeMoney(request.getPrecioLista()));
        }
        if (request.getSaldoPendiente() != null) {
            BigDecimal saldoPendiente = normalizeMoney(request.getSaldoPendiente());
            entity.setSaldoPendiente(saldoPendiente);
            if (saldoPendiente.compareTo(BigDecimal.ZERO) > 0) {
                entity.setEstado(EstadoMembresia.PENDIENTE_PAGO);
            } else if (saldoPendiente.compareTo(BigDecimal.ZERO) == 0) {
                entity.setEstado(EstadoMembresia.ACTIVA);
            }
        } else if (request.getEstado() != null) {
            entity.setEstado(request.getEstado());
        }
        syncEstado(entity);

        MembresiaEntity actualizada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(actualizada);
    }

    public MembresiaResponse cambiarEstado(Long id, MembresiaEstadoRequest request) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

        entity.setEstado(resolveEstadoCambioManual(entity, request.getEstado()));
        syncEstado(entity);
        MembresiaEntity actualizada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(actualizada);
    }

    private void validarSocioExiste(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
        }
    }

    private SocioEntity obtenerSocioObligatorio(Long socioId) {
        return socioRepository.findById(socioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));
    }

    private void validarRangoFechas(java.time.LocalDate fechaInicio, java.time.LocalDate fechaVencimiento) {
        if (fechaInicio != null
                && fechaVencimiento != null
                && fechaInicio.isAfter(fechaVencimiento)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de inicio no puede ser mayor a la fecha de vencimiento"
            );
        }
    }

    private void validarPagoInicial(MembresiaAltaConPagoRequest request) {
        if (request.getPrecioLista() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El precio de lista es obligatorio");
        }
        if (request.getMontoPagado() == null || request.getMontoPagado().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto pagado debe ser mayor a cero");
        }
        if (request.getMontoPagado().compareTo(request.getPrecioLista()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El monto pagado no puede superar el precio de lista"
            );
        }
        if (request.getMetodoPago() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El metodo de pago es obligatorio");
        }
    }

    private EstadoMembresia definirEstadoInicial(BigDecimal saldoPendiente) {
        if (saldoPendiente == null || saldoPendiente.compareTo(BigDecimal.ZERO) == 0) {
            return EstadoMembresia.ACTIVA;
        }
        return EstadoMembresia.PENDIENTE_PAGO;
    }

    private EstadoMembresia resolveEstadoCambioManual(
            MembresiaEntity entity,
            EstadoMembresia estadoSolicitado
    ) {
        if (estadoSolicitado == EstadoMembresia.CANCELADA) {
            return EstadoMembresia.CANCELADA;
        }

        if (entity.getFechaVencimiento() != null && entity.getFechaVencimiento().isBefore(LocalDate.now())) {
            return EstadoMembresia.VENCIDA;
        }

        if (entity.getSaldoPendiente() != null && entity.getSaldoPendiente().compareTo(BigDecimal.ZERO) > 0) {
            return EstadoMembresia.PENDIENTE_PAGO;
        }

        return EstadoMembresia.ACTIVA;
    }

    private MembresiaEntity syncEstado(MembresiaEntity entity) {
        EstadoMembresia estadoCalculado = resolveEstadoAutomatico(entity);

        if (entity.getEstado() != estadoCalculado) {
            entity.setEstado(estadoCalculado);
            if (entity.getId() != null) {
                membresiaRepository.save(entity);
            }
        }

        return entity;
    }

    private EstadoMembresia resolveEstadoAutomatico(MembresiaEntity entity) {
        if (entity.getEstado() == EstadoMembresia.CANCELADA) {
            return EstadoMembresia.CANCELADA;
        }

        if (entity.getFechaVencimiento() != null && entity.getFechaVencimiento().isBefore(LocalDate.now())) {
            return EstadoMembresia.VENCIDA;
        }

        if (entity.getSaldoPendiente() != null && entity.getSaldoPendiente().compareTo(BigDecimal.ZERO) > 0) {
            return EstadoMembresia.PENDIENTE_PAGO;
        }

        return EstadoMembresia.ACTIVA;
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return value.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
    }
}
