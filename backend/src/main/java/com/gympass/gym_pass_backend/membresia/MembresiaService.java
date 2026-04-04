package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaActualizarRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaEstadoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final SocioRepository socioRepository;

    public MembresiaService(MembresiaRepository membresiaRepository, SocioRepository socioRepository) {
        this.membresiaRepository = membresiaRepository;
        this.socioRepository = socioRepository;
    }

    public MembresiaResponse crearMembresia(MembresiaCrearRequest request) {
        if (request.getFechaInicio() != null
                && request.getFechaVencimiento() != null
                && request.getFechaInicio().isAfter(request.getFechaVencimiento())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de inicio no puede ser mayor a la fecha de vencimiento"
            );
        }
        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        MembresiaEntity entity = MembresiaMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        entity.setEstado(definirEstadoInicial(request.getSaldoPendiente()));

        MembresiaEntity guardada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public MembresiaResponse obtenerPorId(Long id) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));
        return MembresiaMapper.toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> listarPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        return membresiaRepository.findBySocioId(socioId).stream()
                .map(MembresiaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MembresiaResponse obtenerActivaPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        MembresiaEntity entity = membresiaRepository
                .findFirstBySocioIdAndEstadoOrderByFechaVencimientoDesc(socioId, EstadoMembresia.ACTIVA)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia activa no encontrada"));

        return MembresiaMapper.toResponse(entity);
    }

    public MembresiaResponse actualizarMembresia(Long id, MembresiaActualizarRequest request) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

        if (request.getFechaInicio() != null
                && request.getFechaVencimiento() != null
                && request.getFechaInicio().isAfter(request.getFechaVencimiento())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de inicio no puede ser mayor a la fecha de vencimiento"
            );
        }

        if (request.getFechaInicio() != null) {
            entity.setFechaInicio(request.getFechaInicio());
        }
        if (request.getFechaVencimiento() != null) {
            entity.setFechaVencimiento(request.getFechaVencimiento());
        }
        if (request.getPrecioLista() != null) {
            entity.setPrecioLista(request.getPrecioLista());
        }
        if (request.getSaldoPendiente() != null) {
            entity.setSaldoPendiente(request.getSaldoPendiente());
            if (request.getSaldoPendiente().compareTo(BigDecimal.ZERO) > 0) {
                entity.setEstado(EstadoMembresia.PENDIENTE_PAGO);
            } else if (request.getSaldoPendiente().compareTo(BigDecimal.ZERO) == 0) {
                entity.setEstado(EstadoMembresia.ACTIVA);
            }
        } else if (request.getEstado() != null) {
            entity.setEstado(request.getEstado());
        }

        MembresiaEntity actualizada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(actualizada);
    }

    public MembresiaResponse cambiarEstado(Long id, MembresiaEstadoRequest request) {
        MembresiaEntity entity = membresiaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membresia no encontrada"));

        entity.setEstado(request.getEstado());
        MembresiaEntity actualizada = membresiaRepository.save(entity);
        return MembresiaMapper.toResponse(actualizada);
    }

    private void validarSocioExiste(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
        }
    }

    private EstadoMembresia definirEstadoInicial(BigDecimal saldoPendiente) {
        if (saldoPendiente == null || saldoPendiente.compareTo(BigDecimal.ZERO) == 0) {
            return EstadoMembresia.ACTIVA;
        }
        return EstadoMembresia.PENDIENTE_PAGO;
    }
}
