# Asesoría Inmobiliaria JB — Next.js SSR + NestJS + Prisma 7

Plataforma web para publicar inmuebles en arriendo, recibir contactos, administrar galerías fotográficas y permitir que los arrendatarios consulten y paguen facturas.

## Incluye

- **Frontend SSR** con Next.js 16 App Router y Server Components.
- **Backend REST** con NestJS 11, JWT y control de acceso `ADMIN` / `USER`.
- **Prisma ORM 7** con PostgreSQL, `prisma.config.ts`, cliente generado y `@prisma/adapter-pg`.
- Catálogo público, ficha del inmueble y formulario de contacto.
- Panel administrativo: indicadores, publicación de inmuebles con múltiples fotografías, mensajes y facturas.
- Cuenta del usuario: contratos, facturas pagadas/pendientes y pago.
- Pago local `mock` para desarrollo e integración preparada con **Wompi Checkout Web** y webhook verificado.
- Docker Compose para frontend, API y PostgreSQL.

## Inicio rápido con Docker

1. Copie las variables de entorno:

```bash
cp .env.example .env
```

2. Inicie todo el entorno:

```bash
docker compose up --build
```

Si `5432`, `4000` o `3000` ya estan en uso en su equipo, ajuste `POSTGRES_HOST_PORT`, `API_HOST_PORT`, `WEB_HOST_PORT` y las URLs relacionadas en `.env` antes de iniciar.

3. Abra:

- Sitio: `http://localhost:3000`
- API: `http://localhost:4000/api`

### Usuarios iniciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@asesoriainmobiliariajb.com` | `Admin123*` |
| Arrendatario | `cliente@asesoriainmobiliariajb.com` | `Cliente123*` |

Cambie estas credenciales y `JWT_SECRET` antes de cualquier despliegue real.

## Ejecución local sin Docker

Requiere Node.js 22 y PostgreSQL disponible.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Módulos funcionales

### Sitio público

- Inicio con propiedades destacadas.
- Catálogo filtrable de inmuebles disponibles.
- Detalle de inmueble con galería, características y solicitud de información.
- Formulario de contacto.

### Panel administrativo

Ruta: `/admin`

- Dashboard con total de inmuebles publicados, facturas pendientes, pagos recaudados y contactos nuevos.
- Gestión de inmuebles con carga de hasta 10 imágenes por publicación.
- Consulta de contactos recibidos.
- Consulta y generación de facturas asociadas a contratos.

### Cuenta del arrendatario

Ruta: `/mi-cuenta`

- Lista de facturas y estado de pago.
- Flujo de pago de una factura pendiente.
- En modo `mock`, botón de confirmación para validar todo el ciclo sin cobrar dinero.

## Integración de pagos

Por defecto, el entorno usa:

```env
PAYMENT_PROVIDER=mock
```

Para habilitar Cybervestigio con redirección automática de checkout, configure:

```env
PAYMENT_PROVIDER=cybervestigio
CYBERVESTIGIO_CHECKOUT_URL=https://cybervestigio.com/pagos
CYBERVESTIGIO_RETURN_URL=https://su-dominio/mi-cuenta
```

También puede habilitar Wompi, configure llaves de sandbox o producción y cambie:

```env
PAYMENT_PROVIDER=wompi
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_EVENTS_SECRET=test_events_...
WOMPI_REDIRECT_URL=https://su-dominio/mi-cuenta
```

Configure como webhook público HTTPS:

```text
POST https://su-api/api/payments/wompi/webhook
```

El backend valida el checksum dinámicamente con las propiedades enviadas por Wompi antes de actualizar una factura.

## API principal

| Método | Endpoint | Acceso | Uso |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Público | Crear usuario arrendatario |
| POST | `/api/auth/login` | Público | Autenticación JWT |
| GET | `/api/properties` | Público | Consultar inmuebles publicados |
| GET | `/api/properties/:slug` | Público | Ver detalle |
| POST | `/api/contacts` | Público | Registrar contacto |
| GET | `/api/invoices/me` | Usuario | Facturas propias |
| POST | `/api/payments/invoices/:id/intent` | Usuario | Iniciar pago |
| GET | `/api/admin/dashboard` | Admin | Indicadores |
| POST | `/api/admin/properties` | Admin | Crear inmueble y subir fotos |
| GET | `/api/admin/invoices` | Admin | Consultar facturas |

## Estructura

```text
apps/
  api/   NestJS + Prisma 7 + PostgreSQL + archivos subidos
  web/   Next.js SSR + Server Actions
```

## Consideraciones de producción

- Reemplazar almacenamiento local de fotos por S3, Azure Blob o almacenamiento equivalente.
- Usar HTTPS, secreto JWT robusto y gestor de secretos.
- Mantener `PAYMENT_PROVIDER=wompi` únicamente con llaves protegidas.
- Configurar dominio del webhook en el dashboard del comercio y validar pagos desde el evento, no desde el navegador.
