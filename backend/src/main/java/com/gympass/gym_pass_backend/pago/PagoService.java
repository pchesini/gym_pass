package com.gympass.gym_pass_backend.pago;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.pago.dto.DeudorResponse;
import com.gympass.gym_pass_backend.pago.dto.PagoResponse;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PagoService {

    private final PagoRepository pagoRepository;
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;

    public PagoService(
            PagoRepository pagoRepository,
            SocioRepository socioRepository,
            MembresiaRepository membresiaRepository
    ) {
        this.pagoRepository = pagoRepository;
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
    }

    public PagoResponse crearPago(PagoCrearRequest request) {
        if (request.getSocioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio es obligatorio");
        }
        if (request.getMonto() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto es obligatorio");
        }
        if (request.getMetodoPago() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El metodo de pago es obligatorio");
        }

        BigDecimal montoPago = normalizeMoney(request.getMonto());
        if (montoPago.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto debe ser mayor a cero");
        }

        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        MembresiaEntity membresia = obtenerMembresiaParaPago(request, socio);
        if (membresia != null) {
            syncSaldoPendienteSinPago(membresia);
            validarMontoContraSaldoPendiente(membresia, montoPago);
        }

        PagoEntity entity = PagoMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        entity.setMembresia(membresia);
        entity.setMonto(montoPago);
        if (entity.getFechaPago() == null) {
            entity.setFechaPago(LocalDateTime.now());
        }

        if (membresia != null) {
            actualizarSaldoYEstadoMembresia(membresia, montoPago);
        }

        PagoEntity guardado = pagoRepository.save(entity);
        return PagoMapper.toResponse(guardado);
    }

    @Transactional(readOnly = true)
    public PagoResponse obtenerPorId(Long id) {
        PagoEntity entity = pagoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pago no encontrado"));
        return PagoMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarPagos() {
        return pagoRepository.findAll().stream()
                .map(PagoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        return pagoRepository.findBySocioId(socioId).stream()
                .map(PagoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarPorMembresia(Long membresiaId) {
        validarMembresiaExiste(membresiaId);

        return pagoRepository.findByMembresiaId(membresiaId).stream()
                .map(PagoMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeudorResponse> listarDeudores() {
        return membresiaRepository
                .findAllByOrderByFechaVencimientoDescIdDesc()
                .stream()
                .filter(this::debeFigurarEnDeudores)
                .sorted(Comparator
                        .comparing(MembresiaEntity::getFechaVencimiento, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(MembresiaEntity::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDeudorResponse)
                .collect(Collectors.toList());
    }

    private void validarSocioExiste(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
        }
    }

    private void validarMembresiaExiste(Long membresiaId) {
        if (!membresiaRepository.existsById(membresiaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada");
        }
    }

    private MembresiaEntity obtenerMembresiaParaPago(PagoCrearRequest request, SocioEntity socio) {
        if (request.getMembresiaId() != null) {
            MembresiaEntity membresia = membresiaRepository.findById(request.getMembresiaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

            if (!membresia.getSocio().getId().equals(socio.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La membresia no pertenece al socio informado");
            }

            return membresia;
        }

        return membresiaRepository.findBySocioId(socio.getId()).stream()
                .filter(membresia -> membresia.getEstado() != EstadoMembresia.CANCELADA)
                .max(Comparator
                        .comparing(MembresiaEntity::getFechaVencimiento, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(MembresiaEntity::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private void validarMontoContraSaldoPendiente(MembresiaEntity membresia, BigDecimal montoPago) {
        BigDecimal saldoACobrar = obtenerSaldoACobrar(membresia);

        if (saldoACobrar == null) {
            return;
        }

        if (montoPago.compareTo(saldoACobrar) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El monto del pago no puede superar el valor a cobrar de la membresia"
            );
        }
    }

    private void actualizarSaldoYEstadoMembresia(MembresiaEntity membresia, BigDecimal montoPago) {
        boolean estabaVencida = estaVencida(membresia);
        BigDecimal saldoActual = obtenerSaldoACobrar(membresia);
        BigDecimal nuevoSaldo = normalizeMoney(saldoActual.subtract(montoPago));

        if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
            nuevoSaldo = BigDecimal.ZERO;
        }

        membresia.setSaldoPendiente(nuevoSaldo);

        if (membresia.getEstado() == EstadoMembresia.CANCELADA) {
            return;
        }

        if (estabaVencida) {
            renovarPeriodoVencido(membresia);
        }

        membresia.setEstado(
                nuevoSaldo.compareTo(BigDecimal.ZERO) == 0
                        ? EstadoMembresia.ACTIVA
                        : EstadoMembresia.PENDIENTE_PAGO
        );
    }

    private BigDecimal obtenerSaldoACobrar(MembresiaEntity membresia) {
        if (estaVencida(membresia)) {
            return membresia.getPrecioLista() == null
                    ? BigDecimal.ZERO
                    : normalizeMoney(membresia.getPrecioLista());
        }

        return membresia.getSaldoPendiente() == null
                ? BigDecimal.ZERO
                : membresia.getSaldoPendiente();
    }

    private boolean estaVencida(MembresiaEntity membresia) {
        return membresia.getEstado() == EstadoMembresia.VENCIDA
                || membresia.getFechaVencimiento() != null
                && membresia.getFechaVencimiento().isBefore(LocalDate.now());
    }

    private void syncSaldoPendienteSinPago(MembresiaEntity membresia) {
        if (membresia.getId() == null
                || membresia.getPrecioLista() == null
                || membresia.getPrecioLista().compareTo(BigDecimal.ZERO) <= 0
                || membresia.getSaldoPendiente() == null
                || membresia.getSaldoPendiente().compareTo(BigDecimal.ZERO) != 0
                || !pagoRepository.findByMembresiaId(membresia.getId()).isEmpty()) {
            return;
        }

        membresia.setSaldoPendiente(normalizeMoney(membresia.getPrecioLista()));
        if (membresia.getEstado() != EstadoMembresia.CANCELADA && !estaVencida(membresia)) {
            membresia.setEstado(EstadoMembresia.PENDIENTE_PAGO);
        }
    }

    private void renovarPeriodoVencido(MembresiaEntity membresia) {
        LocalDate fechaVencimientoAnterior = membresia.getFechaVencimiento();
        LocalDate nuevoInicio = fechaVencimientoAnterior != null
                ? fechaVencimientoAnterior.plusDays(1)
                : LocalDate.now();

        membresia.setFechaInicio(nuevoInicio);
        membresia.setFechaVencimiento(
                fechaVencimientoAnterior != null
                        ? fechaVencimientoAnterior.plusMonths(1)
                        : nuevoInicio.plusMonths(1)
        );
    }

    private boolean debeFigurarEnDeudores(MembresiaEntity membresia) {
        return tieneSaldoPendiente(membresia) || estaVencida(membresia);
    }

    private boolean tieneSaldoPendiente(MembresiaEntity membresia) {
        return membresia.getSaldoPendiente() != null
                && membresia.getSaldoPendiente().compareTo(BigDecimal.ZERO) > 0;
    }

    private DeudorResponse toDeudorResponse(MembresiaEntity membresia) {
        SocioEntity socio = membresia.getSocio();
        DeudorResponse response = new DeudorResponse();
        response.setSocioId(socio != null ? socio.getId() : null);
        response.setSocioNombre(socio != null ? socio.getNombreCompleto() : null);
        response.setSocioDni(socio != null ? socio.getDni() : null);
        response.setMembresiaId(membresia.getId());
        response.setFechaVencimiento(membresia.getFechaVencimiento());
        response.setEstadoMembresia(estaVencida(membresia) ? EstadoMembresia.VENCIDA : membresia.getEstado());
        response.setSaldoPendiente(obtenerSaldoACobrar(membresia));
        return response;
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return value.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
    }
}
