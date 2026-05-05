package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaActualizarRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaAltaConPagoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaEstadoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
    public MembresiaResponse crearMembresia(
            @RequestBody MembresiaCrearRequest request,
            Authentication authentication
    ) {
        return membresiaService.crearMembresia(request, puedeVerDatosFinancieros(authentication));
    }

    @PostMapping("/alta-con-pago")
    @ResponseStatus(HttpStatus.CREATED)
    public MembresiaResponse crearMembresiaConPago(
            @RequestBody MembresiaAltaConPagoRequest request,
            Authentication authentication
    ) {
        return membresiaService.crearMembresiaConPagoInicial(request, puedeVerDatosFinancieros(authentication));
    }

    @GetMapping("/{id}")
    public MembresiaResponse obtenerMembresia(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return membresiaService.obtenerPorId(id, puedeVerDatosFinancieros(authentication));
    }

    @GetMapping
    public List<MembresiaResponse> listarTodas(Authentication authentication) {
        return membresiaService.listarTodas(puedeVerDatosFinancieros(authentication));
    }

    @GetMapping("/socio/{socioId}")
    public List<MembresiaResponse> listarPorSocio(
            @PathVariable Long socioId,
            Authentication authentication
    ) {
        return membresiaService.listarPorSocio(socioId, puedeVerDatosFinancieros(authentication));
    }

    @GetMapping("/socio/{socioId}/activa")
    public MembresiaResponse obtenerActivaPorSocio(
            @PathVariable Long socioId,
            Authentication authentication
    ) {
        return membresiaService.obtenerActivaPorSocio(socioId, puedeVerDatosFinancieros(authentication));
    }

    @PutMapping("/{id}")
    public MembresiaResponse actualizarMembresia(
            @PathVariable Long id,
            @RequestBody MembresiaActualizarRequest request,
            Authentication authentication
    ) {
        return membresiaService.actualizarMembresia(id, request, puedeVerDatosFinancieros(authentication));
    }

    @PatchMapping("/{id}/estado")
    public MembresiaResponse cambiarEstado(
            @PathVariable Long id,
            @RequestBody MembresiaEstadoRequest request,
            Authentication authentication
    ) {
        return membresiaService.cambiarEstado(id, request, puedeVerDatosFinancieros(authentication));
    }

    private boolean puedeVerDatosFinancieros(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "ROLE_ADMIN".equals(authority.getAuthority())
                                || "ROLE_STAFF".equals(authority.getAuthority())
                );
    }
}
