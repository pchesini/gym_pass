package com.gympass.gym_pass_backend.membresia;

import com.gympass.gym_pass_backend.socio.SocioEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "membresias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembresiaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id", nullable = false)
    private SocioEntity socio;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoMembresia estado;

    @Column(name = "precio_lista", nullable = false,precision = 10, scale = 2)
    private BigDecimal precioLista;

    @Column(name = "saldo_pendiente",nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoPendiente;
}
