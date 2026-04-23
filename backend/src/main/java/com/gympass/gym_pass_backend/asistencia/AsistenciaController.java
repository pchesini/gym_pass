package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaQrRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaQrResponse;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AsistenciaResponse registrarEntrada(@RequestBody AsistenciaCrearRequest request) {
        return asistenciaService.registrarEntrada(request);
    }

    @PostMapping("/qr")
    @ResponseStatus(HttpStatus.CREATED)
    public AsistenciaQrResponse registrarEntradaPorQr(@RequestBody AsistenciaQrRequest request) {
        return asistenciaService.registrarEntradaPorQr(request);
    }

    @GetMapping("/{id}")
    public AsistenciaResponse obtenerAsistencia(@PathVariable Long id) {
        return asistenciaService.obtenerPorId(id);
    }

    @PatchMapping("/{id}/salida")
    public AsistenciaResponse registrarSalida(@PathVariable Long id) {
        return asistenciaService.registrarSalida(id);
    }

    @GetMapping("/socio/{socioId}")
    public List<AsistenciaResponse> listarPorSocio(@PathVariable Long socioId) {
        return asistenciaService.listarPorSocio(socioId);
    }

    @GetMapping("/hoy")
    public List<AsistenciaResponse> listarAsistenciasDeHoy() {
        return asistenciaService.listarAsistenciasDeHoy();
    }

    @GetMapping
    public List<AsistenciaResponse> listarAsistenciasPorFecha(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha
    ) {
        return asistenciaService.listarAsistenciasPorFecha(fecha);
    }
}
