-- =========================
-- LIMPIEZA (dev)
-- =========================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- =========================
-- CREACIÓN DE ENUMS
-- =========================

-- Tipo de credencial: QR, RFID, NFC, PIN, etc.
CREATE TYPE credencial_tipo_enum AS ENUM (
  'QR',
  'RFID',
  'NFC',
  'PIN'
);

-- Método de pago
CREATE TYPE metodo_pago_enum AS ENUM (
  'EFECTIVO',
  'DEBITO',
  'CREDITO',
  'TRANSFERENCIA',
  'MERCADO_PAGO',
  'OTRO'
);

-- =========================
-- TABLA PERSONA
-- =========================
CREATE TABLE persona (
    id                  BIGSERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100) NOT NULL,
    dni                 VARCHAR(20)  NOT NULL UNIQUE,
    fecha_nacimiento    DATE,
    genero              VARCHAR(20),
    telefono            VARCHAR(30),
    email               VARCHAR(150) UNIQUE,
    direccion           VARCHAR(200),
    fecha_alta          TIMESTAMP NOT NULL DEFAULT NOW(),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    objetivo            VARCHAR(200),
    referencia          VARCHAR(200),
    lesiones_condiciones TEXT
);

-- =========================
-- TABLA ROL
-- =========================
CREATE TABLE rol (
    id      BIGSERIAL PRIMARY KEY,
    codigo  VARCHAR(50)  NOT NULL UNIQUE,   -- 'SOCIO', 'ENTRENADOR', 'ADMIN', etc.
    nombre  VARCHAR(100) NOT NULL
);

-- =========================
-- TABLA PERSONA_ROL
-- =========================
CREATE TABLE persona_rol (
    persona_id  BIGINT NOT NULL,
    rol_id      BIGINT NOT NULL,
    fecha_desde DATE   NOT NULL DEFAULT CURRENT_DATE,
    fecha_hasta DATE,
    PRIMARY KEY (persona_id, rol_id, fecha_desde),
    CONSTRAINT fk_persona_rol_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_persona_rol_rol
        FOREIGN KEY (rol_id) REFERENCES rol(id)
);

-- =========================
-- TABLA USUARIO_SISTEMA
-- =========================
CREATE TABLE usuario_sistema (
    id             BIGSERIAL PRIMARY KEY,
    persona_id     BIGINT,
    username       VARCHAR(100) NOT NULL UNIQUE,  --  usar email
    password_hash  VARCHAR(255) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_usuario_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id)
);

-- =========================
-- TABLA CREDENCIAL_ACCESO
-- =========================
CREATE TABLE credencial_acceso (
    id          BIGSERIAL PRIMARY KEY,
    persona_id  BIGINT NOT NULL,
    tipo        credencial_tipo_enum NOT NULL,
    valor       VARCHAR(200) NOT NULL,
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_credencial_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT uq_credencial_tipo_valor UNIQUE (tipo, valor)
);

-- =========================
-- TABLA PROMOCION
-- =========================
CREATE TABLE promocion (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    tipo_descuento VARCHAR(20) NOT NULL,          -- 'PORCENTAJE' o 'MONTO_FIJO'
    valor          NUMERIC(10,2) NOT NULL,
    fecha_inicio   DATE,
    fecha_fin      DATE,
    activa         BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================
-- TABLA MEMBRESIA
-- =========================
CREATE TABLE membresia (
    id                BIGSERIAL PRIMARY KEY,
    persona_id        BIGINT NOT NULL,            -- debe tener rol SOCIO
    tipo              VARCHAR(50) NOT NULL,
    fecha_inicio      DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado            VARCHAR(20) NOT NULL,       -- VIGENTE, VENCIDA, etc.
    precio_lista      NUMERIC(10,2),
    saldo_pendiente   NUMERIC(10,2) DEFAULT 0,
    promocion_id      BIGINT,
    CONSTRAINT fk_membresia_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_membresia_promocion
        FOREIGN KEY (promocion_id) REFERENCES promocion(id)
);

-- =========================
-- TABLA PAGO
-- =========================
CREATE TABLE pago (
    id                       BIGSERIAL PRIMARY KEY,
    persona_id               BIGINT NOT NULL,
    membresia_id             BIGINT,
    fecha_pago               TIMESTAMP NOT NULL DEFAULT NOW(),
    monto                    NUMERIC(10,2) NOT NULL,
    metodo_pago              metodo_pago_enum NOT NULL,
    observaciones            TEXT,
    promocion_id             BIGINT,
    registrado_por_usuario_id BIGINT,
    CONSTRAINT fk_pago_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_pago_membresia
        FOREIGN KEY (membresia_id) REFERENCES membresia(id),
    CONSTRAINT fk_pago_promocion
        FOREIGN KEY (promocion_id) REFERENCES promocion(id),
    CONSTRAINT fk_pago_usuario_registrador
        FOREIGN KEY (registrado_por_usuario_id) REFERENCES usuario_sistema(id)
);

-- =========================
-- TABLA ASISTENCIA
-- =========================
CREATE TABLE asistencia (
    id                       BIGSERIAL PRIMARY KEY,
    persona_id               BIGINT NOT NULL,
    credencial_id            BIGINT,
    fecha_hora_entrada       TIMESTAMP NOT NULL,
    fecha_hora_salida        TIMESTAMP,
    duracion_minutos         INT,
    tipo_registro            VARCHAR(20),     -- 'STAFF', 'SELF_SERVICE'
    registrado_por_usuario_id BIGINT,
    CONSTRAINT fk_asistencia_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_asistencia_credencial
        FOREIGN KEY (credencial_id) REFERENCES credencial_acceso(id),
    CONSTRAINT fk_asistencia_usuario
        FOREIGN KEY (registrado_por_usuario_id) REFERENCES usuario_sistema(id)
);

-- =========================
-- TABLA FEEDBACK
-- =========================
CREATE TABLE feedback (
    id                     BIGSERIAL PRIMARY KEY,
    persona_id             BIGINT NOT NULL,
    fecha                  TIMESTAMP NOT NULL DEFAULT NOW(),
    tipo                   VARCHAR(20),         -- 'DEL_SOCIO', 'ENTRENADOR', etc.
    comentario             TEXT NOT NULL,
    creado_por_usuario_id  BIGINT,
    CONSTRAINT fk_feedback_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id),
    CONSTRAINT fk_feedback_usuario
        FOREIGN KEY (creado_por_usuario_id) REFERENCES usuario_sistema(id)
);

-- =========================
-- TABLA ENTRENADOR_DETALLE
-- =========================
CREATE TABLE entrenador_detalle (
    persona_id    BIGINT PRIMARY KEY,           -- 1 a 1 con persona
    especialidad  VARCHAR(100),
    horario_base  VARCHAR(100),
    salario       NUMERIC(10,2),
    CONSTRAINT fk_entrenador_persona
        FOREIGN KEY (persona_id) REFERENCES persona(id)
);

-- =========================
-- ÍNDICES ÚTILES
-- =========================
CREATE INDEX idx_persona_email
    ON persona(email);

CREATE INDEX idx_persona_dni
    ON persona(dni);

CREATE INDEX idx_credencial_persona
    ON credencial_acceso(persona_id);

CREATE INDEX idx_asistencia_persona_fecha
    ON asistencia(persona_id, fecha_hora_entrada DESC);

CREATE INDEX idx_membresia_persona_estado
    ON membresia(persona_id, estado);

CREATE INDEX idx_pago_persona_fecha
    ON pago(persona_id, fecha_pago DESC);
