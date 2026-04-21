package com.gympass.gym_pass_backend.pago;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.pago.dto.PagoResponse;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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

        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        MembresiaEntity membresia = null;
        if (request.getMembresiaId() != null) {
            membresia = membresiaRepository.findById(request.getMembresiaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

            if (!membresia.getSocio().getId().equals(socio.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La membresia no pertenece al socio informado");
            }

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

    private void validarMontoContraSaldoPendiente(MembresiaEntity membresia, BigDecimal montoPago) {
        if (membresia.getSaldoPendiente() == null) {
            return;
        }

        if (montoPago.compareTo(membresia.getSaldoPendiente()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El monto del pago no puede superar el saldo pendiente de la membresia"
            );
        }
    }

    private void actualizarSaldoYEstadoMembresia(MembresiaEntity membresia, BigDecimal montoPago) {
        BigDecimal saldoActual = membresia.getSaldoPendiente() == null
                ? BigDecimal.ZERO
                : membresia.getSaldoPendiente();
        BigDecimal nuevoSaldo = normalizeMoney(saldoActual.subtract(montoPago));

        if (nuevoSaldo.compareTo(BigDecimal.ZERO) < 0) {
            nuevoSaldo = BigDecimal.ZERO;
        }

        membresia.setSaldoPendiente(nuevoSaldo);

        if (membresia.getEstado() == EstadoMembresia.CANCELADA || membresia.getEstado() == EstadoMembresia.VENCIDA) {
            return;
        }

        membresia.setEstado(
                nuevoSaldo.compareTo(BigDecimal.ZERO) == 0
                        ? EstadoMembresia.ACTIVA
                        : EstadoMembresia.PENDIENTE_PAGO
        );
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return value.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
    }
}
