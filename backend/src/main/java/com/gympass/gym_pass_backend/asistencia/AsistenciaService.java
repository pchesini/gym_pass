package com.gympass.gym_pass_backend.asistencia;

import com.gympass.gym_pass_backend.membresia.EstadoMembresia;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaCrearRequest;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaResponse;
import com.gympass.gym_pass_backend.asistencia.dto.AsistenciaResumenResponse;
import com.gympass.gym_pass_backend.asistencia.dto.DistribucionAsistenciaResponse;
import com.gympass.gym_pass_backend.asistencia.dto.TopSocioAsistenciaResponse;
import com.gympass.gym_pass_backend.membresia.MembresiaEntity;
import com.gympass.gym_pass_backend.membresia.MembresiaEstadoResolver;
import com.gympass.gym_pass_backend.membresia.MembresiaRepository;
import com.gympass.gym_pass_backend.socio.EstadoSocio;
import com.gympass.gym_pass_backend.socio.SocioEntity;
import com.gympass.gym_pass_backend.socio.SocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class AsistenciaService {

    private static final List<DayOfWeek> DIAS_ORDENADOS = List.of(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
            DayOfWeek.SATURDAY
    );
    private static final List<FranjaHoraria> FRANJAS_HORARIAS = List.of(
            new FranjaHoraria("07:30 - 09:00", LocalTime.of(7, 30), LocalTime.of(9, 0)),
            new FranjaHoraria("09:00 - 10:30", LocalTime.of(9, 0), LocalTime.of(10, 30)),
            new FranjaHoraria("10:30 - 12:00", LocalTime.of(10, 30), LocalTime.of(12, 0)),
            new FranjaHoraria("12:00 - 13:30", LocalTime.of(12, 0), LocalTime.of(13, 30)),
            new FranjaHoraria("13:30 - 15:00", LocalTime.of(13, 30), LocalTime.of(15, 0)),
            new FranjaHoraria("15:00 - 16:30", LocalTime.of(15, 0), LocalTime.of(16, 30)),
            new FranjaHoraria("16:30 - 18:00", LocalTime.of(16, 30), LocalTime.of(18, 0)),
            new FranjaHoraria("18:00 - 19:30", LocalTime.of(18, 0), LocalTime.of(19, 30)),
            new FranjaHoraria("19:30 - 21:00", LocalTime.of(19, 30), LocalTime.of(21, 0)),
            new FranjaHoraria("21:00 - 22:00", LocalTime.of(21, 0), LocalTime.of(22, 0))
    );

    private final AsistenciaRepository asistenciaRepository;
    private final SocioRepository socioRepository;
    private final MembresiaRepository membresiaRepository;
    private final MembresiaEstadoResolver membresiaEstadoResolver;

    public AsistenciaService(
            AsistenciaRepository asistenciaRepository,
            SocioRepository socioRepository,
            MembresiaRepository membresiaRepository,
            MembresiaEstadoResolver membresiaEstadoResolver
    ) {
        this.asistenciaRepository = asistenciaRepository;
        this.socioRepository = socioRepository;
        this.membresiaRepository = membresiaRepository;
        this.membresiaEstadoResolver = membresiaEstadoResolver;
    }

    public AsistenciaResponse registrarEntrada(AsistenciaCrearRequest request) {
        if (request.getCredencialId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La credencial es obligatoria");
        }
        if (request.getSocioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio es obligatorio");
        }

        SocioEntity socio = socioRepository.findById(request.getSocioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado"));

        if (socio.getEstado() != EstadoSocio.ACTIVO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no esta activo");
        }

        List<MembresiaEntity> membresias = membresiaRepository.findBySocioId(request.getSocioId());

        if (membresias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio no tiene una membresia vigente");
        }

        boolean permiteIngreso = membresias.stream()
                .anyMatch(membresiaEstadoResolver::permiteIngreso);

        if (!permiteIngreso) {
            throw construirAccesoBloqueado(socio, membresias);
        }

        AsistenciaEntity entity = AsistenciaMapper.fromCrearRequest(request);
        entity.setSocio(socio);
        if (entity.getFechaHoraEntrada() == null) {
            entity.setFechaHoraEntrada(LocalDateTime.now());
        }

        validarSinAsistenciaDiaria(request.getSocioId(), entity.getFechaHoraEntrada());

        asistenciaRepository.findFirstBySocioIdAndFechaHoraSalidaIsNull(request.getSocioId())
                .ifPresent(asistencia -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio ya tiene una asistencia abierta");
                });

        AsistenciaEntity guardada = asistenciaRepository.save(entity);
        return AsistenciaMapper.toResponse(guardada);
    }

    @Transactional(readOnly = true)
    public AsistenciaResponse obtenerPorId(Long id) {
        AsistenciaEntity entity = asistenciaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asistencia no encontrada"));
        return AsistenciaMapper.toResponse(entity);
    }

    public AsistenciaResponse registrarSalida(Long asistenciaId) {
            AsistenciaEntity entity = asistenciaRepository.findById(asistenciaId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asistencia no encontrada"));

            if (entity.getFechaHoraSalida() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La asistencia ya fue cerrada");
            }

            if (entity.getFechaHoraEntrada() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La asistencia no tiene fecha de entrada registrada");
            }

            LocalDateTime fechaHoraSalida = LocalDateTime.now();
            entity.setFechaHoraSalida(fechaHoraSalida);
            entity.setDuracionMinutos((int) Duration.between(entity.getFechaHoraEntrada(), fechaHoraSalida).toMinutes());

            AsistenciaEntity actualizada = asistenciaRepository.save(entity);
            return AsistenciaMapper.toResponse(actualizada);
        }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarPorSocio(Long socioId) {
        validarSocioExiste(socioId);

        return asistenciaRepository.findBySocioId(socioId).stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarAsistenciasDeHoy() {
        return asistenciaRepository.buscarAsistenciasDeHoy().stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsistenciaResponse> listarAsistenciasPorFecha(LocalDate fecha) {
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();
        return asistenciaRepository.findByFechaHoraEntradaBetween(
                        fechaConsulta.atStartOfDay(),
                        fechaConsulta.plusDays(1).atStartOfDay()
                ).stream()
                .map(AsistenciaMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AsistenciaResumenResponse obtenerResumen(LocalDate desde, LocalDate hasta) {
        LocalDate fechaDesde = desde != null ? desde : LocalDate.now().withDayOfMonth(1);
        LocalDate fechaHasta = hasta != null ? hasta : LocalDate.now();

        if (fechaHasta.isBefore(fechaDesde)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha hasta no puede ser anterior a la fecha desde");
        }

        List<AsistenciaEntity> asistencias = asistenciaRepository.findByFechaHoraEntradaBetween(
                fechaDesde.atStartOfDay(),
                fechaHasta.plusDays(1).atStartOfDay()
        );

        Map<Long, List<AsistenciaEntity>> asistenciasPorSocio = asistencias.stream()
                .filter(asistencia -> asistencia.getSocio() != null && asistencia.getSocio().getId() != null)
                .collect(Collectors.groupingBy(asistencia -> asistencia.getSocio().getId()));

        long cantidadDias = ChronoUnit.DAYS.between(fechaDesde, fechaHasta) + 1;
        BigDecimal promedioDiario = cantidadDias > 0
                ? BigDecimal.valueOf(asistencias.size()).divide(BigDecimal.valueOf(cantidadDias), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<TopSocioAsistenciaResponse> topSocios = asistenciasPorSocio.values().stream()
                .map(this::mapTopSocio)
                .sorted(
                        Comparator.comparing(TopSocioAsistenciaResponse::getCantidadAsistencias).reversed()
                                .thenComparing(TopSocioAsistenciaResponse::getSocioNombre, Comparator.nullsLast(String::compareToIgnoreCase))
                )
                .limit(5)
                .collect(Collectors.toList());
        List<SocioEntity> sociosActivos = socioRepository.findByEstado(EstadoSocio.ACTIVO);
        long sociosActivosSinAsistencia = sociosActivos.stream()
                .filter(socio -> !asistenciasPorSocio.containsKey(socio.getId()))
                .count();
        List<TopSocioAsistenciaResponse> sociosConMenosAsistencias = sociosActivos.stream()
                .map(socio -> mapSocioAsistencia(
                        socio,
                        asistenciasPorSocio.getOrDefault(socio.getId(), List.of()).size()
                ))
                .sorted(
                        Comparator.comparing(TopSocioAsistenciaResponse::getCantidadAsistencias)
                                .thenComparing(TopSocioAsistenciaResponse::getSocioNombre, Comparator.nullsLast(String::compareToIgnoreCase))
                )
                .limit(5)
                .collect(Collectors.toList());

        AsistenciaResumenResponse response = new AsistenciaResumenResponse();
        response.setFechaDesde(fechaDesde);
        response.setFechaHasta(fechaHasta);
        response.setTotalAsistencias(asistencias.size());
        response.setSociosUnicos(asistenciasPorSocio.size());
        response.setSociosActivosSinAsistencia(sociosActivosSinAsistencia);
        response.setPromedioDiario(promedioDiario);
        response.setTopSocios(topSocios);
        response.setSociosConMenosAsistencias(sociosConMenosAsistencias);
        response.setAsistenciasPorFecha(buildAsistenciasPorFecha(asistencias, fechaDesde, fechaHasta));
        response.setAsistenciasPorDia(buildAsistenciasPorDia(asistencias));
        response.setAsistenciasPorFranjaHoraria(buildAsistenciasPorFranjaHoraria(asistencias));
        response.setAsistenciasPorDiaYFranja(buildAsistenciasPorDiaYFranja(asistencias));
        return response;
    }

    private List<DistribucionAsistenciaResponse> buildAsistenciasPorFecha(
            List<AsistenciaEntity> asistencias,
            LocalDate fechaDesde,
            LocalDate fechaHasta
    ) {
        Map<LocalDate, Long> conteoPorFecha = new LinkedHashMap<>();
        LocalDate fechaActual = fechaDesde;

        while (!fechaActual.isAfter(fechaHasta)) {
            conteoPorFecha.put(fechaActual, 0L);
            fechaActual = fechaActual.plusDays(1);
        }

        asistencias.stream()
                .filter(asistencia -> asistencia.getFechaHoraEntrada() != null)
                .forEach(asistencia -> {
                    LocalDate fecha = asistencia.getFechaHoraEntrada().toLocalDate();
                    conteoPorFecha.computeIfPresent(fecha, (key, value) -> value + 1);
                });

        return conteoPorFecha.entrySet().stream()
                .map(entry -> mapDistribucion(entry.getKey(), formatDia(entry.getKey().getDayOfWeek()), null, entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<DistribucionAsistenciaResponse> buildAsistenciasPorDia(List<AsistenciaEntity> asistencias) {
        Map<String, Long> conteoPorDia = DIAS_ORDENADOS.stream()
                .collect(Collectors.toMap(
                        this::formatDia,
                        dia -> 0L,
                        Long::sum,
                        LinkedHashMap::new
                ));

        asistencias.stream()
                .filter(asistencia -> asistencia.getFechaHoraEntrada() != null)
                .filter(this::estaDentroDeFranjasOperativas)
                .forEach(asistencia -> {
                    String dia = formatDia(asistencia.getFechaHoraEntrada().getDayOfWeek());
                    conteoPorDia.computeIfPresent(dia, (key, value) -> value + 1);
                });

        return conteoPorDia.entrySet().stream()
                .map(entry -> mapDistribucion(entry.getKey(), null, entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<DistribucionAsistenciaResponse> buildAsistenciasPorFranjaHoraria(List<AsistenciaEntity> asistencias) {
        Map<String, Long> conteoPorFranja = FRANJAS_HORARIAS.stream()
                .collect(Collectors.toMap(
                        FranjaHoraria::label,
                        franja -> 0L,
                        Long::sum,
                        LinkedHashMap::new
                ));

        asistencias.stream()
                .filter(asistencia -> asistencia.getFechaHoraEntrada() != null)
                .map(asistencia -> resolveFranja(asistencia.getFechaHoraEntrada().toLocalTime()))
                .filter(franja -> franja != null)
                .forEach(franja -> conteoPorFranja.computeIfPresent(franja.label(), (key, value) -> value + 1));

        return conteoPorFranja.entrySet().stream()
                .map(entry -> mapDistribucion(null, entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private List<DistribucionAsistenciaResponse> buildAsistenciasPorDiaYFranja(List<AsistenciaEntity> asistencias) {
        Map<String, Long> conteoPorDiaYFranja = new LinkedHashMap<>();
        DIAS_ORDENADOS.forEach(dia -> FRANJAS_HORARIAS.forEach(franja ->
                conteoPorDiaYFranja.put(buildDiaFranjaKey(formatDia(dia), franja.label()), 0L)
        ));

        asistencias.stream()
                .filter(asistencia -> asistencia.getFechaHoraEntrada() != null)
                .forEach(asistencia -> {
                    LocalDateTime fechaHoraEntrada = asistencia.getFechaHoraEntrada();
                    FranjaHoraria franja = resolveFranja(fechaHoraEntrada.toLocalTime());

                    if (franja == null) {
                        return;
                    }

                    String dia = formatDia(fechaHoraEntrada.getDayOfWeek());
                    String key = buildDiaFranjaKey(dia, franja.label());
                    conteoPorDiaYFranja.computeIfPresent(key, (currentKey, value) -> value + 1);
                });

        List<DistribucionAsistenciaResponse> distribucion = new ArrayList<>();
        DIAS_ORDENADOS.forEach(dia -> FRANJAS_HORARIAS.forEach(franja -> {
            String diaLabel = formatDia(dia);
            String franjaLabel = franja.label();
            distribucion.add(mapDistribucion(
                    diaLabel,
                    franjaLabel,
                    conteoPorDiaYFranja.get(buildDiaFranjaKey(diaLabel, franjaLabel))
            ));
        }));

        return distribucion;
    }

    private boolean estaDentroDeFranjasOperativas(AsistenciaEntity asistencia) {
        return resolveFranja(asistencia.getFechaHoraEntrada().toLocalTime()) != null;
    }

    private FranjaHoraria resolveFranja(LocalTime hora) {
        return FRANJAS_HORARIAS.stream()
                .filter(franja -> !hora.isBefore(franja.desde()) && hora.isBefore(franja.hasta()))
                .findFirst()
                .orElse(null);
    }

    private String formatDia(DayOfWeek dia) {
        return switch (dia) {
            case MONDAY -> "Lunes";
            case TUESDAY -> "Martes";
            case WEDNESDAY -> "Miercoles";
            case THURSDAY -> "Jueves";
            case FRIDAY -> "Viernes";
            case SATURDAY -> "Sabado";
            case SUNDAY -> "Domingo";
        };
    }

    private String buildDiaFranjaKey(String dia, String franja) {
        return dia + "|" + franja;
    }

    private DistribucionAsistenciaResponse mapDistribucion(String dia, String franja, Long cantidad) {
        return mapDistribucion(null, dia, franja, cantidad);
    }

    private DistribucionAsistenciaResponse mapDistribucion(LocalDate fecha, String dia, String franja, Long cantidad) {
        DistribucionAsistenciaResponse response = new DistribucionAsistenciaResponse();
        response.setFecha(fecha);
        response.setDia(dia);
        response.setFranja(franja);
        response.setCantidad(cantidad != null ? cantidad : 0L);
        return response;
    }

    private TopSocioAsistenciaResponse mapTopSocio(List<AsistenciaEntity> asistenciasSocio) {
        AsistenciaEntity asistenciaReferencia = asistenciasSocio.get(0);
        SocioEntity socio = asistenciaReferencia.getSocio();

        return mapSocioAsistencia(socio, asistenciasSocio.size());
    }

    private TopSocioAsistenciaResponse mapSocioAsistencia(SocioEntity socio, long cantidadAsistencias) {
        TopSocioAsistenciaResponse response = new TopSocioAsistenciaResponse();
        response.setSocioId(socio.getId());
        response.setSocioNombre(socio.getNombreCompleto());
        response.setSocioDni(socio.getDni());
        response.setCantidadAsistencias(cantidadAsistencias);
        return response;
    }

    private void validarSocioExiste(Long socioId) {
        if (!socioRepository.existsById(socioId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Socio no encontrado");
        }
    }

    private void validarSinAsistenciaDiaria(Long socioId, LocalDateTime fechaHoraEntrada) {
        LocalDate fechaEntrada = fechaHoraEntrada.toLocalDate();
        boolean yaRegistroAsistencia = asistenciaRepository.existsBySocioIdAndFechaHoraEntradaBetween(
                socioId,
                fechaEntrada.atStartOfDay(),
                fechaEntrada.plusDays(1).atStartOfDay()
        );

        if (yaRegistroAsistencia) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El socio ya registro asistencia hoy");
        }
    }

    private AsistenciaAccesoBloqueadoException construirAccesoBloqueado(
            SocioEntity socio,
            List<MembresiaEntity> membresias
    ) {
        MembresiaEntity membresiaReferencia = membresias.stream()
                .max(Comparator.comparing(
                        MembresiaEntity::getFechaVencimiento,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ))
                .orElse(null);

        EstadoMembresia estadoMembresia = membresiaReferencia != null
                ? membresiaEstadoResolver.resolveEstadoAutomatico(membresiaReferencia)
                : null;
        BigDecimal saldoPendiente = membresiaReferencia != null && membresiaReferencia.getSaldoPendiente() != null
                ? membresiaReferencia.getSaldoPendiente()
                : BigDecimal.ZERO;
        boolean membresiaVencida = estadoMembresia == EstadoMembresia.VENCIDA;
        boolean tieneSaldoPendiente = saldoPendiente.compareTo(BigDecimal.ZERO) > 0;

        return new AsistenciaAccesoBloqueadoException(
                construirMensajeBloqueo(membresiaVencida, tieneSaldoPendiente),
                socio.getId(),
                socio.getNombreCompleto(),
                membresiaReferencia != null ? membresiaReferencia.getId() : null,
                estadoMembresia,
                membresiaReferencia != null ? membresiaReferencia.getFechaVencimiento() : null,
                saldoPendiente,
                membresiaVencida,
                tieneSaldoPendiente
        );
    }

    private String construirMensajeBloqueo(boolean membresiaVencida, boolean tieneSaldoPendiente) {
        if (membresiaVencida && tieneSaldoPendiente) {
            return "No se puede registrar asistencia porque la membresia esta vencida y registra saldo pendiente";
        }
        if (membresiaVencida) {
            return "No se puede registrar asistencia porque la membresia esta vencida";
        }
        if (tieneSaldoPendiente) {
            return "No se puede registrar asistencia porque la membresia registra saldo pendiente";
        }
        return "El socio no tiene una membresia habilitada para registrar asistencia";
    }

    private record FranjaHoraria(String label, LocalTime desde, LocalTime hasta) {
    }
}
