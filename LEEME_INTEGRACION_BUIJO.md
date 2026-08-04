# Actualización integrada BUIJO

Esta versión incorpora al proyecto principal las funcionalidades de los dos ZIP proporcionados y conserva la corrección de carga de imágenes.

## Funcionalidades incorporadas

1. **Importación de arrendamientos desde Excel/JSON**
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
   - Nueva sección `/admin/conciliacion`.
   - Consulta de cuentas receptoras, lotes importados y notificaciones de pago.

4. **Eliminación definitiva de inmuebles**
   - Todos los inmuebles del panel tienen el botón `Eliminar`.
   - La confirmación elimina el inmueble y, cuando existan, sus contratos, facturas, partidas y pagos asociados.
   - También elimina de MinIO las imágenes y la foto 360 asociadas.
   - Las notificaciones bancarias se conservan como auditoría, pero quedan sin vínculos al inmueble eliminado.

## Archivos de integración

- `integrations/n8n/`: workflows importables en n8n.
- `integrations/excel/`: Excel normalizado y JSON de importación.
- `integrations/docs/`: contratos y documentación de los paquetes originales.
- `apps/api/scripts/import-arrendamientos.ts`: importador Prisma.
- `k8s/12-integration-migrate-job.yaml`: migración de base de datos.
- `k8s/13-import-arrendamientos-job.yaml`: importación opcional.

## Variables obligatorias

Consulte `.env.example`. En producción deben existir al menos:

- `N8N_PAYMENTS_API_KEY`
- `BANCOLOMBIA_ALLOWED_SENDERS`
- `BANCOLOMBIA_ACCOUNT_LAST4`
- `IMPORT_ADMIN_EMAIL`

No publique la API key, remitentes ni información bancaria en Git.
