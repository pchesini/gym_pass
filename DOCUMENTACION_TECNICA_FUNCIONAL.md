# Documentacion Tecnica y Funcional

## 1. Introduccion
Este documento describe la estructura tecnica y el funcionamiento funcional del sistema Gym Pass.

## 2. Arquitectura
## 2.1 Arquitectura general
El proyecto esta compuesto por dos aplicaciones:
- backend: API REST
- frontend: aplicacion web Angular

La arquitectura esta organizada por feature en ambos lados.

## 2.2 Backend
Ruta base:
- `backend/src/main/java/com/gympass/gym_pass_backend`

Features:
- `socio`
- `membresia`
- `pago`
- `asistencia`

Capas por feature:
- `Controller`: expone endpoints
- `Service`: reglas de negocio
- `Repository`: acceso a datos
- `Entity`: modelo persistente
- `Mapper`: conversion entre entidades y DTOs
- `dto`: contratos request/response

Archivo de arranque:
- [GymPassBackendApplication.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/GymPassBackendApplication.java:1)

Configuracion general:
- [WebConfig.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/config/WebConfig.java:1)

## 2.3 Frontend
Ruta base:
- `frontend/gym-pass-frontend/src/app`

Features:
- `dashboard`
- `socios`
- `membresias`
- `pagos`
- `asistencias`

Capas por feature:
- `components`
- `pages`
- `services`
- `models`
- `mappers`
- `routes`

Enrutamiento principal:
- [app.routes.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/app/app.routes.ts:1)

Configuracion global:
- [app.config.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/app/app.config.ts:1)
- [main.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/main.ts:1)
- [main.server.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/main.server.ts:1)

## 3. Modelo funcional
## 3.1 Socio
Representa a la persona que se vincula con el gimnasio.

Campos funcionales principales:
- identificacion
- datos personales
- estado administrativo
- fecha de alta
- fecha de nacimiento
- QR

Estados:
- `ACTIVO`
- `INACTIVO`

## 3.2 Membresia
Representa la vigencia comercial del servicio contratado por el socio.

Campos principales:
- fecha de inicio
- fecha de vencimiento
- precio de lista
- saldo pendiente
- estado

Estados:
- `ACTIVA`
- `VENCIDA`
- `CANCELADA`
- `PENDIENTE_PAGO`

Regla central:
- la vigencia real de la membresia se resuelve en [MembresiaEstadoResolver.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/membresia/MembresiaEstadoResolver.java:1)

## 3.3 Pago
Representa un cobro recibido.

Campos principales:
- socio asociado
- membresia asociada opcional
- fecha de pago
- monto
- metodo de pago
- observaciones

## 3.4 Asistencia
Representa un movimiento de ingreso/egreso del socio.

Campos principales:
- fecha y hora de entrada
- fecha y hora de salida
- duracion
- tipo de registro

## 4. Descripcion por modulo
## 4.1 Modulo Socios
### Backend
Controlador:
- [SocioController.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/socio/SocioController.java:1)

Servicios cubiertos:
- crear socio
- listar socios
- buscar por texto
- filtrar por estado
- filtrar por vencidos
- obtener por id
- actualizar socio
- cambiar estado
- obtener QR

### Frontend
Rutas:
- `/socios`
- `/socios/nuevo`
- `/socios/:id`
- `/socios/:id/editar`

Componentes:
- listado
- formulario
- detalle

## 4.2 Modulo Membresias
### Backend
Controlador:
- [MembresiaController.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/membresia/MembresiaController.java:1)

Servicios cubiertos:
- crear membresia
- crear membresia con pago inicial
- listar todas
- listar por socio
- obtener activa por socio
- obtener por id
- actualizar
- cambiar estado

Reglas destacadas:
- la fecha de inicio no puede superar la fecha de vencimiento
- el estado se sincroniza automaticamente por fecha y saldo

### Frontend
Rutas:
- `/membresias`
- `/membresias/nueva`
- `/membresias/:id`
- `/membresias/:id/editar`

Componentes:
- listado global y por socio
- formulario de alta/edicion
- detalle

Mejoras funcionales incluidas:
- registro de pago inicial
- acceso directo a registrar pago si hay deuda
- visualizacion de estado actualizado

## 4.3 Modulo Pagos
### Backend
Controlador:
- [PagoController.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/pago/PagoController.java:1)

Servicios cubiertos:
- crear pago
- listar pagos
- obtener por id
- listar por socio
- listar por membresia

Reglas destacadas:
- valida monto obligatorio
- valida metodo de pago
- valida relacion socio/membresia
- impide pagar por encima del saldo pendiente
- actualiza saldo y estado de la membresia

### Frontend
Rutas:
- `/pagos`
- `/pagos/nuevo`
- `/pagos/:id`

Componentes:
- formulario
- detalle
- listado
- resumen de pagos

Capacidades actuales:
- filtros por rango de fechas, socio y metodo
- resumen de resultado filtrado
- exportacion CSV
- atajos temporales
- contexto de membresia en el registro de pago

## 4.4 Modulo Asistencias
### Backend
Controlador:
- [AsistenciaController.java](/home/pablo/proyectos/gym_pass/backend/src/main/java/com/gympass/gym_pass_backend/asistencia/AsistenciaController.java:1)

Servicios cubiertos:
- registrar entrada
- registrar salida
- obtener por id
- listar por socio
- listar de hoy
- listar por fecha

Reglas destacadas:
- el socio debe estar activo
- no puede existir otra asistencia abierta
- la membresia debe estar vigente habilitada
- `ACTIVA` y `PENDIENTE_PAGO` vigente permiten ingreso

### Frontend
Rutas:
- `/asistencias`
- `/asistencias/:id`

Componentes:
- check-in de recepcion
- listado historico
- detalle

Capacidades actuales:
- filtro por fecha real
- mensaje de saldo pendiente en recepcion
- registro de entrada y salida

## 4.5 Dashboard
### Frontend
Ruta:
- `/dashboard`

Servicio principal:
- [dashboard.service.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/app/features/dashboard/services/dashboard.service.ts:1)

Indicadores incluidos:
- socios totales, activos e inactivos
- membresias activas, vencidas, canceladas y pendientes
- asistencias de hoy
- pagos totales
- monto total cobrado
- pagos de hoy
- monto cobrado hoy
- pagos del mes
- monto cobrado del mes

Listados operativos:
- membresias por vencer
- membresias con deuda
- ultimos pagos
- ultimas asistencias
- socios recientes

## 5. Relacion entre modulos
### Socio y Membresia
- el socio representa la entidad administrativa
- la membresia representa la vigencia comercial
- un socio activo puede no tener membresia vigente

### Membresia y Pago
- el pago puede impactar sobre una membresia
- el saldo pendiente pertenece a la membresia
- el pago modifica saldo y estado comercial

### Socio, Membresia y Asistencia
- la asistencia depende del estado del socio y de la membresia vigente habilitada
- una membresia con deuda pero vigente no bloquea el ingreso

## 6. Formato y localizacion
La aplicacion se encuentra configurada en espanol con locale `es-AR`.

Formato de fecha unificado:
- `dd-MM-yyyy`

Formato de fecha y hora:
- `dd-MM-yyyy HH:mm`

Configuracion central:
- [app.config.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/app/app.config.ts:1)
- [app-date-adapter.ts](/home/pablo/proyectos/gym_pass/frontend/gym-pass-frontend/src/app/core/config/app-date-adapter.ts:1)

## 7. Estado de madurez
El sistema cubre la operacion principal diaria del gimnasio y permite trabajar con datos reales del backend. Todavia tiene espacio de evolucion en:
- seguridad
- permisos
- auditoria
- reportes historicos backend
- analitica avanzada

## 8. Recomendaciones de gestion
- utilizar el dashboard como vista ejecutiva
- utilizar el modulo pagos como historial operativo
- utilizar membresias como fuente principal para vigencia y deuda
- preservar la separacion conceptual entre socio y membresia
