# Contrato API: n8n → aplicación Prisma

## Endpoint

`POST /api/integrations/n8n/bancolombia/reconcile`

Encabezados:

```http
Content-Type: application/json
X-API-Key: <N8N_PAYMENTS_API_KEY>
```

## Solicitud

```json
{
  "outlookMessageId": "AAMk...",
  "internetMessageId": "<correo@bancolombia>",
  "sender": "remitente-verificado@bancolombia.com.co",
  "subject": "Notificación de transferencia",
  "payerName": "NOMBRE DE QUIEN PAGA",
  "amount": 1500000,
  "currency": "COP",
  "accountLast4": "1234",
  "bankReference": "ABC123456",
  "receivedAt": "2026-07-22T14:30:00-05:00",
  "rawPayload": {
    "bodyPreview": "Texto limitado del correo"
  }
}
```

## Respuesta confirmada

```json
{
  "action": "CONFIRMED",
  "reason": "Coincidencia única con puntaje 100.",
  "paymentId": "cuid",
  "notificationId": "cuid",
  "reference": "BCO:ABC123456",
  "tenant": {
    "id": "cuid",
    "name": "Carlos Pérez",
    "email": "carlos@example.com"
  },
  "property": {
    "id": "cuid",
    "address": "Dirección del inmueble"
  },
  "invoice": {
    "id": "cuid",
    "code": "AR-001-2026-07",
    "amount": 1500000
  }
}
```

## Respuestas alternativas

- `REVIEW_REQUIRED`: valor, cuenta o pagador no producen una coincidencia única.
- `DUPLICATE`: el `outlookMessageId` o la referencia ya se procesó.
- `REJECTED`: cuenta no autorizada o solicitud inválida.

La API no debe devolver números completos de cuenta ni documentos completos.
