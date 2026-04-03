# Reglas del proyecto

- Responder y comentar en español.
- Arquitectura por feature.
- No hacer refactors grandes sin pedirlos.
- No tocar el módulo socio salvo que sea necesario.
- Implementar primero el backend, luego pruebas con Postman.
- Priorizar cambios pequeños y revisables.
- Respetar el modelo de datos:
  - fechaNacimiento y fechaAlta en Socio
  - vencimientos en Membresía
  - pagos en Pago
  - asistencias en Asistencia
- Antes de agregar un campo, verificar si pertenece a Socio, Membresía, Pago o Asistencia.
- Mantener consistencia con el estilo actual del proyecto.
- No romper endpoints existentes de Socio.