package com.gympass.gym_pass_backend.pago;

import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.pago.dto.PagoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PagoResponse crearPago(@RequestBody PagoCrearRequest request) {
        return pagoService.crearPago(request);
    }

    @GetMapping
    public List<PagoResponse> listarPagos() {
        return pagoService.listarPagos();
    }

    @GetMapping("/{id}")
    public PagoResponse obtenerPago(@PathVariable Long id) {
        return pagoService.obtenerPorId(id);
    }

    @GetMapping("/socio/{socioId}")
    public List<PagoResponse> listarPorSocio(@PathVariable Long socioId) {
        return pagoService.listarPorSocio(socioId);
    }

    @GetMapping("/membresia/{membresiaId}")
    public List<PagoResponse> listarPorMembresia(@PathVariable Long membresiaId) {
        return pagoService.listarPorMembresia(membresiaId);
    }
}
