package com.gympass.gym_pass_backend.socio;

import com.gympass.gym_pass_backend.socio.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/socios")
public class SocioController {

    private final SocioService socioService;

    public SocioController(SocioService socioService) {
        this.socioService = socioService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SocioResponse crearSocio(@RequestBody SocioCrearRequest request) {
        return socioService.crearSocio(request);
    }

    @GetMapping
    public List<SocioResponse> listarSocios(
            @RequestParam(required = false) EstadoSocio estado,
            //@RequestParam(required = false) Boolean vencidos,
            @RequestParam(required = false) String busqueda
    ) {
        return socioService.listarSocios(estado, busqueda);
    }

    @GetMapping("/{id}")
    public SocioResponse obtenerSocio(@PathVariable Long id) {
        return socioService.obtenerPorId(id);
    }

    @PutMapping("/{id}")
    public SocioResponse actualizarSocio(
            @PathVariable Long id,
            @RequestBody SocioActualizarRequest request
    ) {
        return socioService.actualizarSocio(id, request);
    }

    @PatchMapping("/{id}/estado")
    public SocioResponse cambiarEstado(
            @PathVariable Long id,
            @RequestBody SocioEstadoRequest request
    ) {
        return socioService.cambiarEstado(id, request);
    }

    @GetMapping("/{id}/qr")
    public SocioQrResponse obtenerQr(@PathVariable Long id) {
        return socioService.obtenerQr(id);
    }
}
