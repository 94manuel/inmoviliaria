# Migración desde el esquema actual

El archivo `prisma/schema.prisma` es un **esquema objetivo completo**. Antes de sustituir el esquema de producción, revise estos cambios:

1. `User.passwordHash` pasa a ser opcional para permitir arrendatarios importados que todavía no tienen acceso web.
2. `Lease.userId`, `Invoice.userId` y `Payment.userId` pasan a ser opcionales.
3. Se agregan `Tenant` y `Owner` porque el Excel contiene personas sin correo, contraseña ni cuenta de usuario.
4. `Lease` incorpora `tenantId`, valores esperados, estado, datos legados y aliases de pagador.
5. `Invoice` y `Payment` incorporan `tenantId`.
6. `PaymentProvider` incorpora `BANCOLOMBIA_EMAIL` y `MANUAL`.
7. Se agregan cuentas receptoras, notificaciones bancarias e historial de importación.

## Secuencia recomendada

1. Haga copia de seguridad de PostgreSQL.
2. Aplique primero los campos y tablas nuevas, sin eliminar datos existentes.
3. Migre cada `User` arrendatario existente a un registro `Tenant` relacionado.
4. Complete `tenantId` en contratos, facturas y pagos existentes.
5. Solo después haga obligatorios los campos que correspondan en su aplicación.
6. Ejecute el importador del Excel en un ambiente de pruebas.
7. Revise `ImportRecord` y la hoja `Requieren_Revision` antes de producción.

No ejecute `prisma migrate reset` en una base con información real.
