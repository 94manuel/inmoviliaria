# BUIJO — Integración Excel + Prisma + n8n

Este paquete reemplaza el cruce directo e inseguro contra un Excel por una arquitectura auditable:

1. El Excel empresarial se normaliza.
2. Los datos se importan a Prisma/PostgreSQL.
3. n8n recibe el correo de Outlook y extrae pagador, valor, cuenta y referencia.
4. La API Prisma valida además el remitente contra `BANCOLOMBIA_ALLOWED_SENDERS` y busca una factura pendiente por cuenta, valor y nombre.
5. Solo una coincidencia única registra el pago y habilita el correo al arrendatario.

## Resultado del archivo aportado

- Registros de arrendamiento: **92**
- Propietarios identificados: **27**
- Nombres únicos de arrendatarios: **83**
- Activos inferidos: **79**
- Terminados: **7**
- Revisión jurídica: **5**
- Preaviso: **1**
- Registros con alertas de calidad: **32**

## Archivos principales

- `BUIJO_Base_Normalizada_Arrendamientos.xlsx`
- `data/arrendamientos_normalizados.json`
- `prisma/schema.prisma`
- `MIGRACION_DESDE_ESQUEMA_ACTUAL.md`
- `scripts/import-arrendamientos.ts`
- `src/services/bancolombia-reconciliation.ts`
- `src/app/api/integrations/n8n/bancolombia/reconcile/route.ts`
- `n8n/BUIJO_v2_conciliacion_bancolombia_prisma.json`

## Instalación

1. Copie el `schema.prisma` o fusione los modelos nuevos con su esquema.
2. Ejecute la migración:

```bash
npx prisma format
npx prisma migrate dev --name excel_arrendamientos_y_conciliacion_bancaria
npx prisma generate
```

3. Copie `.env.example` a `.env` y complete los valores.
4. Importe los datos:

```bash
npx tsx scripts/import-arrendamientos.ts data/arrendamientos_normalizados.json
```

5. Importe el workflow JSON en n8n.
6. Configure la credencial de Outlook y una credencial Header Auth:

```text
Header: X-API-Key
Valor: el mismo N8N_PAYMENTS_API_KEY
```

7. En el nodo `Extraer datos bancarios`, reemplace:
   - dominio de la aplicación;
   - correo interno;
   - remitente bancario exacto;
   - últimos cuatro dígitos de las cuentas.

8. Pruebe las ramas: válido, ambiguo, duplicado, cuenta no autorizada y arrendatario sin correo.

## Advertencia esencial

El Excel no permite vincular de forma confiable cada arrendamiento con una cuenta Bancolombia.  
La cuenta valida que el abono ingresó a un producto autorizado; la identificación del arrendatario se realiza por factura pendiente, valor y nombre/alias del pagador.

Los 32 registros marcados deben revisarse antes de permitir conciliación automática.
