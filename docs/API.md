# Contrato REST principal

Base local: `http://localhost:4000/api`

## Autenticación

### `POST /auth/login`

```json
{ "email": "cliente@asesoriainmobiliariajb.com", "password": "Cliente123*" }
```

Respuesta:

```json
{ "accessToken": "jwt", "user": { "sub": "...", "email": "...", "name": "...", "role": "USER" } }
```

En endpoints privados enviar `Authorization: Bearer <jwt>`.

## Inmuebles

- `GET /properties/featured`
- `GET /properties?search=chico&city=Bogotá&maxRent=4000000`
- `GET /properties/:slug`
- `GET /admin/properties` — administrador.
- `POST /admin/properties` — administrador, `multipart/form-data`; campo de archivos `photos`.
- `POST /admin/properties/:id/images` — administrador, añade fotos.
- `DELETE /admin/properties/:id` — administrador, archiva la publicación.

Campos del formulario administrativo: `title`, `description`, `monthlyRent`, `administrationFee`, `deposit`, `city`, `neighborhood`, `address`, `bedrooms`, `bathrooms`, `areaM2`, `parking`, `features`, `published`, `photos`.

## Contactos

- `POST /contacts` — público.
- `GET /admin/contacts` — administrador.

## Facturación

- `GET /invoices/me` — usuario autenticado.
- `GET /invoices/me/:id` — usuario propietario de la factura.
- `GET /admin/invoices` — administrador.
- `POST /admin/invoices` — administrador.
- `GET /admin/leases` — administrador; contratos para generar factura.

## Pagos

- `POST /payments/invoices/:invoiceId/intent` — crea intento del usuario.
- `POST /payments/mock/:reference/approve` — únicamente modo local.
- `POST /payments/wompi/webhook` — evento público verificado con `X-Event-Checksum` o `signature.checksum`.
