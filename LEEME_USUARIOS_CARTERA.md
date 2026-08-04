# Gestión de usuarios y cartera

Esta versión agrega una vista administrativa unificada para usuarios históricos y cuentas web.

## Funciones principales

- Menú **Usuarios** en el panel administrativo.
- Directorio con nombre, documento, contacto, cuenta web, inmueble actual y estado de cartera.
- Detalle completo con contratos, inmuebles, facturas y pagos.
- Creación manual de perfiles de usuario.
- Asignación de inmuebles disponibles desde el detalle del usuario.
- Cambio automático del inmueble a `RENTED`, por lo que deja de aparecer como disponible.
- Creación del cobro corriente al asignar un inmueble.
- Actualización automática de facturas vencidas al consultar la cartera.
- Historial de pagos preservado incluso cuando un inmueble se retira del catálogo.
- Vinculación automática entre perfiles históricos y cuentas web cuando el correo coincide.
- Carga idempotente de 92 registros históricos mediante Kubernetes Job.

## Rutas

- Web: `/admin/usuarios`
- API: `GET /api/admin/users`
- API: `GET /api/admin/users/:id`
- API: `POST /api/admin/users`
- API: `POST /api/admin/users/:id/assign-property`

Consulte `DEPLOY_ACTUALIZACION_USUARIOS_CARTERA.md` para desplegar esta versión.
