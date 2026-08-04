# Gestión de facturas y contratos firmados

Esta versión amplía el panel administrativo y la cuenta de cada usuario.

## Facturas

Desde **Administración → Facturas** ahora se puede:

- modificar el valor facturado;
- consultar el saldo pendiente calculado después de pagos aprobados;
- cambiar el estado de pago entre pendiente, vencida, pagada y anulada;
- modificar periodo y fecha de vencimiento;
- registrar una observación administrativa;
- eliminar una factura de las vistas de administración y del usuario.

La eliminación es lógica: la factura deja de participar en cartera, conciliación y vistas, pero se conserva la trazabilidad técnica. Los pagos previamente aprobados no se destruyen.

Cuando un administrador marca una factura como pagada y no existe un pago aprobado que cubra el valor, el sistema registra automáticamente un movimiento con proveedor `MANUAL`. Si posteriormente se cambia nuevamente a pendiente o vencida, ese movimiento manual se conserva como anulado.

## Contratos firmados en PDF

Cada contrato de arrendamiento puede tener un PDF firmado.

El administrador puede:

- cargar el PDF desde el detalle del usuario;
- reemplazar el PDF existente;
- visualizarlo sin descargarlo;
- descargarlo;
- retirarlo del contrato.

El usuario con cuenta web puede entrar a **Mi cuenta → Mis contratos firmados** para visualizar o descargar sus documentos.

Los PDFs se guardan en MinIO con propósito privado `LEASE_CONTRACT`. No se exponen mediante el endpoint público de archivos; el acceso requiere un JWT válido y se valida que el usuario sea el titular del contrato o un administrador.

## Base de datos

La migración nueva es:

```text
202608040002_invoice_management_and_contract_pdfs
```

Agrega:

- relación de un PDF privado con cada contrato;
- fecha de carga del contrato;
- notas administrativas de factura;
- eliminación lógica y motivo de eliminación de factura;
- el propósito de almacenamiento `LEASE_CONTRACT`.

## Límites

El contrato debe:

- tener extensión `.pdf`;
- usar MIME `application/pdf`;
- contener la firma interna `%PDF-`;
- pesar máximo 25 MB por defecto.

La variable configurable es:

```text
CONTRACT_MAX_FILE_SIZE=25000000
```
