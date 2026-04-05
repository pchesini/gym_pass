package com.gympass.gym_pass_backend.pago;

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

        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        MembresiaEntity membresia = null;
        if (request.getMembresiaId() != null) {
            membresia = membresiaRepository.findById(request.getMembresiaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

            if (!membresia.getSocio().getId().equals(socio.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La membresia no pertenece al socio informado");
            }
        }

        PagoEntity entity = PagoMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        entity.setMembresia(membresia);
        if (entity.getFechaPago() == null) {
            entity.setFechaPago(LocalDateTime.now());
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
}
