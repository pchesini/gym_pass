package com.gympass.gym_pass_backend.pago;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.pago.dto.DeudorResponse;
import com.gympass.gym_pass_backend.pago.dto.PagoCrearRequest;
import com.gympass.gym_pass_backend.socio.EstadoSocio;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private PagoService pagoService;

    @BeforeEach
    void setUp() {
        pagoService = new PagoService(pagoRepository, socioRepository, membresiaRepository);
    }

    @Test
    void crearPagoRechazaMontoCero() {
        PagoCrearRequest request = pagoRequest(new BigDecimal("0"));

        assertThatThrownBy(() -> pagoService.crearPago(request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void crearPagoAsociadoCancelaSaldoYActivaMembresia() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresia(socio);
        PagoCrearRequest request = pagoRequest(new BigDecimal("10000"));
        request.setMembresiaId(10L);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresia));
        when(pagoRepository.save(any(PagoEntity.class))).thenAnswer(invocation -> {
            PagoEntity pago = invocation.getArgument(0);
            pago.setId(20L);
            return pago;
        });

        pagoService.crearPago(request);

        assertThat(membresia.getSaldoPendiente()).isEqualByComparingTo("0.00");
        assertThat(membresia.getEstado()).isEqualTo(EstadoMembresia.ACTIVA);
    }

    @Test
    void crearPagoSinMembresiaIdAsociaLaMembresiaMasRecienteDelSocio() {
        SocioEntity socio = socio();
        MembresiaEntity membresiaAnterior = membresia(socio);
        membresiaAnterior.setId(9L);
        membresiaAnterior.setFechaVencimiento(LocalDate.now().minusMonths(1));
        membresiaAnterior.setSaldoPendiente(new BigDecimal("5000.00"));
        MembresiaEntity membresiaActual = membresia(socio);
        PagoCrearRequest request = pagoRequest(new BigDecimal("10000"));

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findBySocioId(1L)).thenReturn(List.of(membresiaAnterior, membresiaActual));
        when(pagoRepository.save(any(PagoEntity.class))).thenAnswer(invocation -> {
            PagoEntity pago = invocation.getArgument(0);
            pago.setId(20L);
            return pago;
        });

        var response = pagoService.crearPago(request);

        assertThat(response.getMembresiaId()).isEqualTo(10L);
        assertThat(membresiaActual.getSaldoPendiente()).isEqualByComparingTo("0.00");
        assertThat(membresiaActual.getEstado()).isEqualTo(EstadoMembresia.ACTIVA);
    }

    @Test
    void crearPagoAsociadoCancelaSaldoRenuevaYActivaMembresiaVencida() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresia(socio);
        membresia.setFechaInicio(LocalDate.now().minusMonths(2));
        membresia.setFechaVencimiento(LocalDate.now().minusMonths(1));
        membresia.setEstado(EstadoMembresia.VENCIDA);
        PagoCrearRequest request = pagoRequest(new BigDecimal("10000"));
        request.setMembresiaId(10L);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresia));
        when(pagoRepository.save(any(PagoEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        pagoService.crearPago(request);

        assertThat(membresia.getSaldoPendiente()).isEqualByComparingTo("0.00");
        assertThat(membresia.getEstado()).isEqualTo(EstadoMembresia.ACTIVA);
        assertThat(membresia.getFechaInicio()).isEqualTo(LocalDate.now());
        assertThat(membresia.getFechaVencimiento()).isAfter(LocalDate.now());
    }

    @Test
    void crearPagoPermiteRenovarMembresiaVencidaSinSaldoPendiente() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresia(socio);
        membresia.setFechaInicio(LocalDate.now().minusMonths(2));
        membresia.setFechaVencimiento(LocalDate.now().minusMonths(1));
        membresia.setSaldoPendiente(BigDecimal.ZERO);
        membresia.setEstado(EstadoMembresia.VENCIDA);
        PagoCrearRequest request = pagoRequest(new BigDecimal("10000"));
        request.setMembresiaId(10L);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresia));
        when(pagoRepository.save(any(PagoEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        pagoService.crearPago(request);

        assertThat(membresia.getSaldoPendiente()).isEqualByComparingTo("0.00");
        assertThat(membresia.getEstado()).isEqualTo(EstadoMembresia.ACTIVA);
        assertThat(membresia.getFechaInicio()).isEqualTo(LocalDate.now());
        assertThat(membresia.getFechaVencimiento()).isAfter(LocalDate.now());
    }

    @Test
    void listarDeudoresDevuelveMembresiasConSaldoPendiente() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresia(socio);

        when(membresiaRepository.findBySaldoPendienteGreaterThanOrderByFechaVencimientoAscIdAsc(BigDecimal.ZERO))
                .thenReturn(List.of(membresia));

        List<DeudorResponse> deudores = pagoService.listarDeudores();

        assertThat(deudores).hasSize(1);
        assertThat(deudores.get(0).getSocioId()).isEqualTo(1L);
        assertThat(deudores.get(0).getSocioNombre()).isEqualTo("Socio Test");
        assertThat(deudores.get(0).getSocioDni()).isEqualTo("12345678");
        assertThat(deudores.get(0).getMembresiaId()).isEqualTo(10L);
        assertThat(deudores.get(0).getSaldoPendiente()).isEqualByComparingTo("10000.00");
        assertThat(deudores.get(0).getEstadoMembresia()).isEqualTo(EstadoMembresia.PENDIENTE_PAGO);
    }

    private PagoCrearRequest pagoRequest(BigDecimal monto) {
        PagoCrearRequest request = new PagoCrearRequest();
        request.setSocioId(1L);
        request.setMonto(monto);
        request.setMetodoPago(MetodoPago.EFECTIVO);
        return request;
    }

    private SocioEntity socio() {
        return SocioEntity.builder()
                .id(1L)
                .nombreCompleto("Socio Test")
                .dni("12345678")
                .estado(EstadoSocio.ACTIVO)
                .qrCode("QR-TEST")
                .fechaAlta(LocalDate.now())
                .build();
    }

    private MembresiaEntity membresia(SocioEntity socio) {
        return MembresiaEntity.builder()
                .id(10L)
                .socio(socio)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .precioLista(new BigDecimal("10000.00"))
                .saldoPendiente(new BigDecimal("10000.00"))
                .estado(EstadoMembresia.PENDIENTE_PAGO)
                .build();
    }
}
