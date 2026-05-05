package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.membresia.dto.MembresiaAltaConPagoRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaCrearRequest;
import com.gympass.gym_pass_backend.membresia.dto.MembresiaResponse;
import com.gympass.gym_pass_backend.pago.MetodoPago;
import com.gympass.gym_pass_backend.pago.PagoRepository;
import com.gympass.gym_pass_backend.socio.EstadoSocio;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MembresiaServiceTest {

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private PagoRepository pagoRepository;

    private MembresiaService membresiaService;

    @BeforeEach
    void setUp() {
        membresiaService = new MembresiaService(
                membresiaRepository,
                socioRepository,
                pagoRepository,
                new MembresiaEstadoResolver()
        );

        lenient().when(socioRepository.findById(1L)).thenReturn(Optional.of(socio()));
        lenient().when(membresiaRepository.save(any(MembresiaEntity.class))).thenAnswer(invocation -> {
            MembresiaEntity membresia = invocation.getArgument(0);
            if (membresia.getId() == null) {
                membresia.setId(10L);
            }
            return membresia;
        });
    }

    @Test
    void crearMembresiaSinPagoInicialDejaSaldoPendientePorElPrecio() {
        MembresiaCrearRequest request = new MembresiaCrearRequest();
        request.setSocioId(1L);
        request.setFechaInicio(LocalDate.now());
        request.setFechaVencimiento(LocalDate.now().plusMonths(1));
        request.setPrecioLista(new BigDecimal("10000"));
        request.setSaldoPendiente(BigDecimal.ZERO);

        MembresiaResponse response = membresiaService.crearMembresia(request);

        assertThat(response.getSaldoPendiente()).isEqualByComparingTo("10000.00");
        assertThat(response.getEstado()).isEqualTo(EstadoMembresia.PENDIENTE_PAGO);
    }

    @Test
    void crearMembresiaConPagoInicialTotalQuedaActivaYSinSaldo() {
        MembresiaAltaConPagoRequest request = new MembresiaAltaConPagoRequest();
        request.setSocioId(1L);
        request.setFechaInicio(LocalDate.now());
        request.setFechaVencimiento(LocalDate.now().plusMonths(1));
        request.setPrecioLista(new BigDecimal("10000"));
        request.setMontoPagado(new BigDecimal("10000"));
        request.setMetodoPago(MetodoPago.EFECTIVO);

        MembresiaResponse response = membresiaService.crearMembresiaConPagoInicial(request);

        assertThat(response.getSaldoPendiente()).isEqualByComparingTo("0.00");
        assertThat(response.getEstado()).isEqualTo(EstadoMembresia.ACTIVA);
        verify(pagoRepository).save(any());
    }

    @Test
    void obtenerPorIdCorrigeMembresiaSinPagoGuardadaComoActiva() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = MembresiaEntity.builder()
                .id(20L)
                .socio(socio)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .precioLista(new BigDecimal("10000.00"))
                .saldoPendiente(BigDecimal.ZERO)
                .estado(EstadoMembresia.ACTIVA)
                .build();

        when(membresiaRepository.findById(20L)).thenReturn(Optional.of(membresia));
        when(pagoRepository.findByMembresiaId(20L)).thenReturn(List.of());

        MembresiaResponse response = membresiaService.obtenerPorId(20L);

        assertThat(response.getSaldoPendiente()).isEqualByComparingTo("10000.00");
        assertThat(response.getEstado()).isEqualTo(EstadoMembresia.PENDIENTE_PAGO);
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
}
