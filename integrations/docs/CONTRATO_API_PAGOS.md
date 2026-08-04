# Contrato mínimo de API para la página web

El workflow usa una credencial n8n de tipo **Header Auth**:

- Nombre del encabezado: `X-API-Key`
- Valor: clave secreta generada por la página web.

Todos los endpoints deben usar HTTPS y responder JSON.

## 1. Conciliar un pago

`POST /api/n8n/arrendamientos/conciliar-pago`

### Solicitud

```json
{
  "cuentaDestino": "****0000",
  "ultimos4Cuenta": "0000",
  "pagador": "NOMBRE DEL PAGADOR",
  "valor": 1500000,
  "moneda": "COP",
  "referenciaBancaria": "ABC123456",
  "referenciaIdempotencia": "ABC123456",
  "fechaPago": "2026-07-22T14:30:00-05:00",
  "idCorreoOutlook": "ID_UNICO_DEL_CORREO",
  "asuntoCorreo": "Notificación de transferencia"
}
```

### Respuesta cuando coincide

```json
{
  "coincide": true,
  "motivo": "Coincidencia por cuenta, pagador y valor",
  "arrendatario": {
    "id": "ARR-104",
    "nombre": "Carlos Pérez",
    "email": "carlos@example.com",
    "contratoId": "CONT-2026-18",
    "contrato": "2026-18",
    "inmueble": "Apartamento 301 - Calle de ejemplo",
    "valorEsperado": 1500000
  }
}
```

### Respuesta cuando no coincide

```json
{
  "coincide": false,
  "motivo": "No existe obligación pendiente con esos datos"
}
```

La API debe comparar, como mínimo:

1. Últimos cuatro dígitos de la cuenta receptora.
2. Nombre del arrendatario o pagador autorizado.
3. Valor esperado y tolerancia permitida.
4. Contrato activo.
5. Periodo pendiente de pago.

## 2. Registrar el pago

`POST /api/n8n/arrendamientos/registrar-pago`

### Solicitud

```json
{
  "arrendatarioId": "ARR-104",
  "contratoId": "CONT-2026-18",
  "valor": 1500000,
  "moneda": "COP",
  "pagador": "NOMBRE DEL PAGADOR",
  "banco": "Bancolombia",
  "ultimos4Cuenta": "0000",
  "referenciaBancaria": "ABC123456",
  "referenciaIdempotencia": "ABC123456",
  "fechaPago": "2026-07-22T14:30:00-05:00",
  "idCorreoOutlook": "ID_UNICO_DEL_CORREO",
  "origen": "OUTLOOK_BANCOLOMBIA_N8N"
}
```

### Registro correcto

```json
{
  "registrado": true,
  "pagoId": "PAG-9001"
}
```

### Registro ya existente

Puede responder HTTP 409 o:

```json
{
  "duplicado": true,
  "pagoId": "PAG-9001"
}
```

La base de datos debe imponer una restricción única sobre
`referenciaIdempotencia` y, preferiblemente, también sobre `idCorreoOutlook`.
Esto evita aplicar o notificar dos veces el mismo pago.

## Seguridad mínima

- HTTPS obligatorio.
- API key almacenada como credencial de n8n, no dentro del JSON.
- Registro de auditoría de consultas y escrituras.
- Cuenta de API con permisos limitados únicamente a conciliación y registro.
- No devolver números completos de cuentas bancarias.
- Validar importes en el servidor; no confiar solamente en los datos del correo.
- No registrar un pago como definitivo únicamente por el remitente visible del email.
