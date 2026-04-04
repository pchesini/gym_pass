package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaActualizarRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaEstadoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membresias")
public class MembresiaController {

    private final MembresiaService membresiaService;

    public MembresiaController(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MembresiaResponse crearMembresia(@RequestBody MembresiaCrearRequest request) {
        return membresiaService.crearMembresia(request);
    }

    @GetMapping("/{id}")
    public MembresiaResponse obtenerMembresia(@PathVariable Long id) {
        return membresiaService.obtenerPorId(id);
    }

    @GetMapping("/socio/{socioId}")
    public List<MembresiaResponse> listarPorSocio(@PathVariable Long socioId) {
        return membresiaService.listarPorSocio(socioId);
    }

    @GetMapping("/socio/{socioId}/activa")
    public MembresiaResponse obtenerActivaPorSocio(@PathVariable Long socioId) {
        return membresiaService.obtenerActivaPorSocio(socioId);
    }

    @PutMapping("/{id}")
    public MembresiaResponse actualizarMembresia(
            @PathVariable Long id,
            @RequestBody MembresiaActualizarRequest request
    ) {
        return membresiaService.actualizarMembresia(id, request);
    }

    @PatchMapping("/{id}/estado")
    public MembresiaResponse cambiarEstado(
            @PathVariable Long id,
            @RequestBody MembresiaEstadoRequest request
    ) {
        return membresiaService.cambiarEstado(id, request);
    }
}
