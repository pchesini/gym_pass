# Documento de Alcance

## 1. Proposito
Definir el alcance funcional y tecnico del sistema Gym Pass para su gestion, seguimiento y evolucion.

## 2. Objetivo del proyecto
Desarrollar una solucion web para administrar la operatoria central de un gimnasio, cubriendo socios, membresias, pagos, asistencias y seguimiento operativo mediante dashboard.

## 3. Alcance funcional incluido
### 3.1 Socios
Incluye:
- alta de socios
- edicion de datos personales
- activacion e inactivacion
- consulta de detalle
- consulta de QR
- busqueda y filtrado

No incluye por ahora:
- autenticacion del socio
- portal de autoservicio para socios
- firma digital de terminos

### 3.2 Membresias
Incluye:
- alta de membresias
- alta de membresias con pago inicial
- edicion de datos de membresia
- consulta global y por socio
- cambio manual de estado
- calculo automatico de estado segun fecha y saldo

No incluye por ahora:
- planes comerciales parametrizables
- renovacion automatica
- promociones complejas

### 3.3 Pagos
Incluye:
- registro de pagos
- consulta de historial
- filtros por periodo, socio, metodo y texto libre
- exportacion CSV del historial filtrado
- actualizacion de saldo pendiente en membresia

No incluye por ahora:
- integracion con pasarelas de pago
- caja diaria formal
- arqueo de caja
- anulacion de pagos

### 3.4 Asistencias
Incluye:
- registro de entrada
- registro de salida
- historial por fecha y socio
- flujo de recepcion
- validacion de acceso segun estado del socio y membresia vigente

No incluye por ahora:
- molinetes
- biometricos
- cierre automatico masivo al fin del dia
- reglas horarias avanzadas

### 3.5 Dashboard
Incluye:
- indicadores de socios
- indicadores de membresias
- indicadores de pagos
- indicadores de asistencias
- cobros del dia y del mes
- listados operativos de deuda y vencimientos

No incluye por ahora:
- BI avanzado
- comparativos mensuales historicos
- graficos analiticos

## 4. Alcance tecnico incluido
### Backend
- API REST para los cuatro modulos principales
- persistencia con entidades JPA
- validaciones de negocio en servicios
- estructura por feature

### Frontend
- SPA Angular
- enrutamiento lazy por feature
- componentes standalone
- formularios reactivos
- Angular Material
- formato global de fechas en espanol

## 5. Reglas de negocio cubiertas
- el socio se administra por estado propio
- la membresia controla la vigencia comercial
- el pago impacta en el saldo de la membresia
- la asistencia requiere socio activo y membresia vigente habilitada
- una membresia pendiente de pago pero vigente permite el ingreso

## 6. Usuarios objetivo
- administracion
- recepcion
- responsable del gimnasio

## 7. Beneficios esperados
- centralizacion de la operatoria
- menor dependencia de registros manuales
- mejor trazabilidad de pagos y asistencias
- visibilidad operativa del estado del negocio

## 8. Limites del alcance actual
- no hay control de roles y permisos
- no hay integracion con hardware o pasarelas
- no hay modulo formal de reportes historicos backend
- varios resumenes se calculan actualmente en frontend

## 9. Criterios de exito
- registrar socios, membresias, pagos y asistencias sin procesos manuales paralelos
- consultar deuda y vencimientos en tiempo real
- disponer de un historial de pagos util para gestion
- contar con un dashboard operativo diario y mensual

## 10. Proximas extensiones sugeridas
- roles y seguridad
- reportes mensuales backend
- exportaciones adicionales
- planes y promociones parametrizadas
- auditoria de cambios
