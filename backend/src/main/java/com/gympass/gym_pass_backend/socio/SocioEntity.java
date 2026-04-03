package com.gympass.gym_pass_backend.socio;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "socios",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_socio_dni", columnNames = "dni"),
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "dni", nullable = false, length = 20)
    private String dni;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoSocio estado;

    @Column(name = "qr_code", nullable = false, length = 50)
    private String qrCode;

   // @Column(name = "fecha_vencimiento")
    //private LocalDate fechaVencimiento;

    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

}
