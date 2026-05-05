package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.DistribucionAsistenciaResponse;
import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaEstadoResolver;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.socio.EstadoSocio;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AsistenciaServiceTest {

    @Mock
    private AsistenciaRepository asistenciaRepository;

    @Mock
    private SocioRepository socioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private AsistenciaService asistenciaService;

    @BeforeEach
    void setUp() {
        asistenciaService = new AsistenciaService(
                asistenciaRepository,
                socioRepository,
                membresiaRepository,
                new MembresiaEstadoResolver()
        );
    }

    @Test
    void registrarEntradaBloqueaConDetalleCuandoLaMembresiaEstaVencidaYConSaldo() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresiaVencidaConSaldo(socio);
        AsistenciaCrearRequest request = new AsistenciaCrearRequest();
        request.setSocioId(1L);
        request.setCredencialId(100L);
        request.setTipoRegistro(TipoRegistroAsistencia.STAFF);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findBySocioId(1L)).thenReturn(List.of(membresia));

        assertThatThrownBy(() -> asistenciaService.registrarEntrada(request))
                .isInstanceOfSatisfying(AsistenciaAccesoBloqueadoException.class, exception -> {
                    assertThat(exception.getMessage())
                            .isEqualTo("No se puede registrar asistencia porque la membresia esta vencida y registra saldo pendiente");
                    assertThat(exception.getSocioId()).isEqualTo(1L);
                    assertThat(exception.getSocioNombre()).isEqualTo("Socio Test");
                    assertThat(exception.getMembresiaId()).isEqualTo(10L);
                    assertThat(exception.getEstadoMembresia()).isEqualTo(EstadoMembresia.VENCIDA);
                    assertThat(exception.getFechaVencimiento()).isEqualTo(LocalDate.now().minusDays(1));
                    assertThat(exception.getSaldoPendiente()).isEqualByComparingTo("10000.00");
                    assertThat(exception.isMembresiaVencida()).isTrue();
                    assertThat(exception.isTieneSaldoPendiente()).isTrue();
                });
    }

    @Test
    void registrarEntradaPermiteIngresoCuandoLaMembresiaTieneSaldoPendiente() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresiaPendienteDePago(socio);
        AsistenciaCrearRequest request = new AsistenciaCrearRequest();
        request.setSocioId(1L);
        request.setCredencialId(100L);
        request.setTipoRegistro(TipoRegistroAsistencia.STAFF);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findBySocioId(1L)).thenReturn(List.of(membresia));
        when(asistenciaRepository.findFirstBySocioIdAndFechaHoraSalidaIsNull(1L)).thenReturn(Optional.empty());
        when(asistenciaRepository.save(any(AsistenciaEntity.class))).thenAnswer(invocation -> {
            AsistenciaEntity asistencia = invocation.getArgument(0);
            asistencia.setId(20L);
            return asistencia;
        });

        var response = asistenciaService.registrarEntrada(request);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getSocioId()).isEqualTo(1L);
    }

    @Test
    void registrarEntradaBloqueaCuandoElSocioYaRegistroAsistenciaEseDia() {
        SocioEntity socio = socio();
        MembresiaEntity membresia = membresiaPendienteDePago(socio);
        LocalDateTime fechaHoraEntrada = LocalDateTime.of(2026, 5, 2, 9, 0);
        AsistenciaCrearRequest request = new AsistenciaCrearRequest();
        request.setSocioId(1L);
        request.setCredencialId(100L);
        request.setFechaHoraEntrada(fechaHoraEntrada);
        request.setTipoRegistro(TipoRegistroAsistencia.STAFF);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findBySocioId(1L)).thenReturn(List.of(membresia));
        when(asistenciaRepository.existsBySocioIdAndFechaHoraEntradaBetween(
                1L,
                fechaHoraEntrada.toLocalDate().atStartOfDay(),
                fechaHoraEntrada.toLocalDate().plusDays(1).atStartOfDay()
        )).thenReturn(true);

        assertThatThrownBy(() -> asistenciaService.registrarEntrada(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getReason()).isEqualTo("El socio ya registro asistencia hoy")
                );
        verify(asistenciaRepository, never()).save(any(AsistenciaEntity.class));
    }

    @Test
    void registrarEntradaBloqueaCuandoElSocioNoTieneMembresiaAsignada() {
        SocioEntity socio = socio();
        AsistenciaCrearRequest request = new AsistenciaCrearRequest();
        request.setSocioId(1L);
        request.setCredencialId(100L);
        request.setTipoRegistro(TipoRegistroAsistencia.STAFF);

        when(socioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findBySocioId(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> asistenciaService.registrarEntrada(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getReason()).isEqualTo("El socio no tiene una membresia asignada")
                );
        verify(asistenciaRepository, never()).save(any(AsistenciaEntity.class));
    }

    @Test
    void obtenerResumenDevuelveRankingDeSociosPorAsistencias() {
        LocalDate desde = LocalDate.of(2026, 5, 1);
        LocalDate hasta = LocalDate.of(2026, 5, 3);
        SocioEntity socioFrecuente = socio();
        SocioEntity socioOcasional = SocioEntity.builder()
                .id(2L)
                .nombreCompleto("Socio Ocasional")
                .dni("87654321")
                .estado(EstadoSocio.ACTIVO)
                .qrCode("QR-TEST-2")
                .fechaAlta(LocalDate.now())
                .build();
        SocioEntity socioSinAsistencias = SocioEntity.builder()
                .id(3L)
                .nombreCompleto("Socio Sin Asistencias")
                .dni("11222333")
                .estado(EstadoSocio.ACTIVO)
                .qrCode("QR-TEST-3")
                .fechaAlta(LocalDate.now())
                .build();

        when(asistenciaRepository.findByFechaHoraEntradaBetween(
                desde.atStartOfDay(),
                hasta.plusDays(1).atStartOfDay()
        )).thenReturn(List.of(
                asistencia(1L, socioFrecuente, LocalDateTime.of(2026, 5, 1, 9, 0)),
                asistencia(2L, socioFrecuente, LocalDateTime.of(2026, 5, 2, 9, 0)),
                asistencia(3L, socioOcasional, LocalDateTime.of(2026, 5, 2, 18, 0))
        ));
        when(socioRepository.findByEstado(EstadoSocio.ACTIVO)).thenReturn(List.of(
                socioFrecuente,
                socioOcasional,
                socioSinAsistencias
        ));

        var response = asistenciaService.obtenerResumen(desde, hasta);

        assertThat(response.getTotalAsistencias()).isEqualTo(3);
        assertThat(response.getSociosUnicos()).isEqualTo(2);
        assertThat(response.getPromedioDiario()).isEqualByComparingTo("1.00");
        assertThat(response.getTopSocios()).hasSize(2);
        assertThat(response.getTopSocios().get(0).getSocioId()).isEqualTo(1L);
        assertThat(response.getTopSocios().get(0).getCantidadAsistencias()).isEqualTo(2);
        assertThat(response.getTopSocios().get(1).getSocioId()).isEqualTo(2L);
        assertThat(response.getTopSocios().get(1).getCantidadAsistencias()).isEqualTo(1);
        assertThat(response.getSociosConMenosAsistencias()).hasSize(3);
        assertThat(response.getSociosConMenosAsistencias().get(0).getSocioId()).isEqualTo(3L);
        assertThat(response.getSociosConMenosAsistencias().get(0).getCantidadAsistencias()).isZero();
        assertThat(response.getSociosActivosSinAsistencia()).isEqualTo(1);
        assertThat(response.getAsistenciasPorFecha()).hasSize(3);
        assertThat(response.getAsistenciasPorFecha().get(0).getFecha()).isEqualTo(desde);
        assertThat(response.getAsistenciasPorFecha().get(0).getCantidad()).isEqualTo(1);
        assertThat(response.getAsistenciasPorFecha().get(1).getCantidad()).isEqualTo(2);
        assertThat(response.getAsistenciasPorFecha().get(2).getCantidad()).isZero();
    }

    @Test
    void obtenerResumenAgrupaAsistenciasPorDiaYFranjaHorariaOperativa() {
        LocalDate desde = LocalDate.of(2026, 5, 4);
        LocalDate hasta = LocalDate.of(2026, 5, 4);
        SocioEntity socio = socio();

        when(asistenciaRepository.findByFechaHoraEntradaBetween(
                desde.atStartOfDay(),
                hasta.plusDays(1).atStartOfDay()
        )).thenReturn(List.of(
                asistencia(1L, socio, LocalDateTime.of(2026, 5, 4, 7, 29)),
                asistencia(2L, socio, LocalDateTime.of(2026, 5, 4, 7, 30)),
                asistencia(3L, socio, LocalDateTime.of(2026, 5, 4, 18, 15)),
                asistencia(4L, socio, LocalDateTime.of(2026, 5, 4, 21, 59)),
                asistencia(5L, socio, LocalDateTime.of(2026, 5, 4, 22, 0))
        ));

        var response = asistenciaService.obtenerResumen(desde, hasta);

        assertThat(findPorDia(response.getAsistenciasPorDia(), "Lunes").getCantidad()).isEqualTo(3);
        assertThat(findPorFranja(response.getAsistenciasPorFranjaHoraria(), "07:30 - 09:00").getCantidad()).isEqualTo(1);
        assertThat(findPorFranja(response.getAsistenciasPorFranjaHoraria(), "18:00 - 19:30").getCantidad()).isEqualTo(1);
        assertThat(findPorFranja(response.getAsistenciasPorFranjaHoraria(), "21:00 - 22:00").getCantidad()).isEqualTo(1);
        assertThat(findPorDiaYFranja(response.getAsistenciasPorDiaYFranja(), "Lunes", "07:30 - 09:00").getCantidad()).isEqualTo(1);
        assertThat(findPorDiaYFranja(response.getAsistenciasPorDiaYFranja(), "Lunes", "21:00 - 22:00").getCantidad()).isEqualTo(1);
        assertThat(response.getAsistenciasPorDia()).noneMatch(item -> "Domingo".equals(item.getDia()));
        assertThat(response.getAsistenciasPorDiaYFranja()).hasSize(60);
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

    private MembresiaEntity membresiaVencidaConSaldo(SocioEntity socio) {
        return MembresiaEntity.builder()
                .id(10L)
                .socio(socio)
                .fechaInicio(LocalDate.now().minusMonths(1))
                .fechaVencimiento(LocalDate.now().minusDays(1))
                .precioLista(new BigDecimal("10000.00"))
                .saldoPendiente(new BigDecimal("5000.00"))
                .estado(EstadoMembresia.PENDIENTE_PAGO)
                .build();
    }

    private MembresiaEntity membresiaPendienteDePago(SocioEntity socio) {
        return MembresiaEntity.builder()
                .id(10L)
                .socio(socio)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .precioLista(new BigDecimal("10000.00"))
                .saldoPendiente(new BigDecimal("6000.00"))
                .estado(EstadoMembresia.PENDIENTE_PAGO)
                .build();
    }

    private AsistenciaEntity asistencia(Long id, SocioEntity socio, LocalDateTime fechaHoraEntrada) {
        return AsistenciaEntity.builder()
                .id(id)
                .socio(socio)
                .credencialId(socio.getId())
                .fechaHoraEntrada(fechaHoraEntrada)
                .tipoRegistro(TipoRegistroAsistencia.STAFF)
                .build();
    }

    private DistribucionAsistenciaResponse findPorDia(
            List<DistribucionAsistenciaResponse> distribucion,
            String dia
    ) {
        return distribucion.stream()
                .filter(item -> dia.equals(item.getDia()))
                .findFirst()
                .orElseThrow();
    }

    private DistribucionAsistenciaResponse findPorFranja(
            List<DistribucionAsistenciaResponse> distribucion,
            String franja
    ) {
        return distribucion.stream()
                .filter(item -> franja.equals(item.getFranja()))
                .findFirst()
                .orElseThrow();
    }

    private DistribucionAsistenciaResponse findPorDiaYFranja(
            List<DistribucionAsistenciaResponse> distribucion,
            String dia,
            String franja
    ) {
        return distribucion.stream()
                .filter(item -> dia.equals(item.getDia()) && franja.equals(item.getFranja()))
                .findFirst()
                .orElseThrow();
    }
}
