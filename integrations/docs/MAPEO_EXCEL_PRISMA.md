# Mapeo del Excel al modelo Prisma

## Fuentes detectadas

- **Hoja1:** registro principal de dirección, propietario, arrendatario, coarrendatarios, contrato y observaciones.
- **Hoja 1, filas 2–88:** listado de arrendatarios y valor esperado.
- **Hoja 1, filas 92–127:** registro de propietarios, direcciones y valor esperado de entrega.
- **Hoja 2:** pagos recibidos y pagos a propietarios para una parte de los registros.
- **Hoja 4:** movimientos históricos de entradas y salidas; se conservan para auditoría, no para marcar facturas actuales.

## Criterios

| Excel | Prisma |
|---|---|
| Número/fila legada | `Property.legacyCode`, `Lease.legacyCode`, `sourceRow` |
| Dirección | `Property.address`, `rawAddress` |
| Propietario | `Owner` + `PropertyOwner` |
| Arrendatario | `Tenant` |
| Coarrendatarios/fiadores | `Lease.rawCoTenants`; deben depurarse antes de convertirlos en `LeaseParty` |
| Fecha y canon | `Lease.startDate`, `expectedMonthlyPayment` |
| Valor a propietario | `PropertyOwner.monthlyExpectedPayout` y `Lease.ownerExpectedPayout` |
| Novedades/observaciones | `Lease.novelty`, `Lease.observations` |
| Estado inferido | `Lease.status` |
| Alertas de calidad | `ImportRecord.reviewReason` |

## Dato no presente

El archivo no contiene una asignación verificable de **cuenta bancaria receptora por arrendamiento**.  
Por eso se creó `ReceivingBankAccount` y `LeaseReceivingAccount`. Las cuentas deben cargarse mediante variables de entorno o administración interna.
