# Gym Pass

## Descripcion
Gym Pass es una aplicacion para la gestion operativa y administrativa de un gimnasio. Permite administrar socios, membresias, pagos y asistencias, y ofrece un dashboard con indicadores para el seguimiento diario y mensual.

El proyecto esta dividido en dos aplicaciones:
- `backend`: API REST desarrollada con Spring Boot.
- `frontend/gym-pass-frontend`: aplicacion web desarrollada con Angular.

## Objetivo del sistema
Centralizar la operatoria principal del gimnasio en una unica plataforma:
- registrar y administrar socios
- asignar y controlar membresias
- registrar pagos y consultar historial de cobros
- registrar entradas y salidas
- visualizar indicadores del negocio

## Modulos funcionales
### Socios
- Alta de socios
- Edicion de datos
- Cambio de estado activo/inactivo
- Consulta de detalle
- Consulta de QR

### Membresias
- Alta de membresias
- Alta de membresias con pago inicial
- Edicion de membresias
- Consulta de detalle
- Cambio de estado
- Consulta global y por socio
- Identificacion de membresias activas, vencidas, canceladas y pendientes de pago

### Pagos
- Registro de pagos
- Asociacion opcional del pago a una membresia
- Consulta de detalle
- Historial de pagos
- Filtros por socio, fecha, metodo y busqueda libre
- Exportacion CSV del historial filtrado

### Asistencias
- Registro de entrada
- Registro de salida
- Consulta de detalle
- Historial por fecha y por socio
- Flujo de recepcion con busqueda rapida

### Dashboard
- Resumen de socios
- Resumen de membresias
- Resumen de asistencias
- Resumen de pagos
- Cobros del dia
- Cobros del mes
- Listados operativos de vencimientos, deuda y ultimos movimientos

## Reglas funcionales principales
- Un socio puede estar activo administrativamente y no tener una membresia vigente.
- La membresia define la vigencia comercial del acceso.
- Una membresia puede estar en estado `ACTIVA`, `VENCIDA`, `CANCELADA` o `PENDIENTE_PAGO`.
- Para registrar asistencia, el socio debe estar `ACTIVO` y tener una membresia vigente habilitada.
- Una membresia vigente con saldo pendiente permite el ingreso, pero informa deuda pendiente.
- Los pagos asociados a membresias actualizan el saldo pendiente y el estado comercial de la membresia.

## Arquitectura general
### Backend
Organizado por feature:
- `socio`
- `membresia`
- `pago`
- `asistencia`

Cada feature contiene:
- `Controller`
- `Service`
- `Repository`
- `Entity`
- `Mapper`
- `dto`

### Frontend
Organizado por feature:
- `dashboard`
- `socios`
- `membresias`
- `pagos`
- `asistencias`

Cada feature contiene, segun corresponda:
- `components`
- `pages`
- `services`
- `models`
- `mappers`
- `routes`

## Estructura del repositorio
```text
gym_pass/
├── backend/
├── docker/
├── frontend/
│   └── gym-pass-frontend/
└── AGENTS.md
```

## Stack tecnologico
### Backend
- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate

### Frontend
- Angular
- Angular Material
- TypeScript
- RxJS

## Endpoints principales
### Socios
- `POST /api/socios`
- `GET /api/socios`
- `GET /api/socios/{id}`
- `PUT /api/socios/{id}`
- `PATCH /api/socios/{id}/estado`
- `GET /api/socios/{id}/qr`

### Membresias
- `POST /api/membresias`
- `POST /api/membresias/alta-con-pago`
- `GET /api/membresias`
- `GET /api/membresias/{id}`
- `GET /api/membresias/socio/{socioId}`
- `GET /api/membresias/socio/{socioId}/activa`
- `PUT /api/membresias/{id}`
- `PATCH /api/membresias/{id}/estado`

### Pagos
- `POST /api/pagos`
- `GET /api/pagos`
- `GET /api/pagos/{id}`
- `GET /api/pagos/socio/{socioId}`
- `GET /api/pagos/membresia/{membresiaId}`

### Asistencias
- `POST /api/asistencias`
- `GET /api/asistencias`
- `GET /api/asistencias/hoy`
- `GET /api/asistencias/{id}`
- `GET /api/asistencias/socio/{socioId}`
- `PATCH /api/asistencias/{id}/salida`

## Estado actual del proyecto
El sistema ya cubre la operacion principal del gimnasio y cuenta con funcionalidades concretas para administracion diaria. Todavia tiene margen para seguir evolucionando en reportes, seguridad, auditoria y automatizacion de procesos.

## Documentacion complementaria
- [Documento de alcance](./DOCUMENTO_ALCANCE.md)
- [Documentacion tecnica y funcional](./DOCUMENTACION_TECNICA_FUNCIONAL.md)
