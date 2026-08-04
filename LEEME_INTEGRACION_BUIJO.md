# Actualización integrada BUIJO

Esta versión incorpora al proyecto principal las funcionalidades de los dos ZIP proporcionados y conserva la corrección de carga de imágenes.

## Funcionalidades incorporadas

1. **Importación de arrendamientos desde datos históricos normalizados**
   - Archivo normalizado de 92 registros.
   - Propietarios, arrendatarios, contratos, alias de pagadores y cuentas receptoras.
   - Auditoría mediante `ImportBatch` e `ImportRecord`.
   - Importador idempotente por SHA-256.

2. **Conciliación Bancolombia con Outlook y n8n**
   - Endpoint recomendado:
     `POST /api/integrations/n8n/bancolombia/reconcile`
   - Endpoints compatibles con el workflow anterior:
     - `POST /api/n8n/arrendamientos/conciliar-pago`
     - `POST /api/n8n/arrendamientos/registrar-pago`
   - Autenticación mediante `X-API-Key`.
   - Validación del remitente bancario, cuenta receptora, valor, pagador, factura pendiente e idempotencia.
   - Registro de pago y actualización de factura dentro de una transacción.
   - Historial auditable de notificaciones bancarias.

3. **Panel administrativo**
   - Sección `/admin/conciliacion` para cuentas receptoras y notificaciones.
   - Sección `/admin/usuarios` con todos los perfiles históricos y las cuentas web.
   - Detalle de información personal, inmuebles, facturas, saldos y pagos.
   - Asignación de inmuebles disponibles con creación opcional del cobro corriente.

4. **Retiro seguro de inmuebles**
   - Todos los inmuebles del panel tienen la opción `Retirar`.
   - Los inmuebles sin historial se eliminan junto con sus archivos.
   - Cuando existen contratos, facturas o pagos, el inmueble se archiva y deja de publicarse para conservar la trazabilidad completa.

## Archivos de integración

- `integrations/n8n/`: workflows importables en n8n.
- `integrations/datos/`: datos normalizados y JSON de importación.
- `integrations/docs/`: contratos y documentación de los paquetes originales.
- `apps/api/scripts/import-arrendamientos.ts`: importador Prisma.
- `k8s/12-integration-migrate-job.yaml`: migración de base de datos.
- `k8s/13-cargar-usuarios-historicos-job.yaml`: carga idempotente de usuarios y contratos históricos.

## Variables obligatorias

Consulte `.env.example`. En producción deben existir al menos:

- `N8N_PAYMENTS_API_KEY`
- `BANCOLOMBIA_ALLOWED_SENDERS`
- `BANCOLOMBIA_ACCOUNT_LAST4`
- `IMPORT_ADMIN_EMAIL`

No publique la API key, remitentes ni información bancaria en Git.
