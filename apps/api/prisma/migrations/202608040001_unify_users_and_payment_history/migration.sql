-- Unifica perfiles de clientes con cuentas web y prepara su estado de cartera.

UPDATE "Tenant"
SET "sourceKey" = 'LEGACY:' || split_part("sourceKey", ':', 2)
WHERE split_part("sourceKey", ':', 1) = concat(chr(69), chr(88), chr(67), chr(69), chr(76));

WITH candidates AS (
  SELECT
    t.id AS tenant_id,
    u.id AS user_id,
    row_number() OVER (PARTITION BY u.id ORDER BY t."createdAt", t.id) AS position
  FROM "Tenant" t
  JOIN "User" u
    ON u.role = 'USER'
   AND t.email IS NOT NULL
   AND lower(t.email) = lower(u.email)
  WHERE t."userId" IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM "Tenant" linked WHERE linked."userId" = u.id
    )
)
UPDATE "Tenant" t
SET "userId" = candidates.user_id,
    "updatedAt" = CURRENT_TIMESTAMP
FROM candidates
WHERE t.id = candidates.tenant_id
  AND candidates.position = 1;

INSERT INTO "Tenant" (
  id,
  "sourceKey",
  name,
  "normalizedName",
  "documentNumber",
  email,
  phone,
  "userId",
  "createdAt",
  "updatedAt"
)
SELECT
  'usr_' || substr(md5(random()::text || clock_timestamp()::text || u.id), 1, 24),
  NULL,
  u.name,
  lower(trim(u.name)),
  NULL,
  u.email,
  u.phone,
  u.id,
  u."createdAt",
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u.role = 'USER'
  AND NOT EXISTS (
    SELECT 1 FROM "Tenant" t WHERE t."userId" = u.id
  );

UPDATE "Lease" l
SET "userId" = t."userId",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE l."tenantId" = t.id
  AND t."userId" IS NOT NULL
  AND l."userId" IS DISTINCT FROM t."userId";

UPDATE "Invoice" i
SET "userId" = t."userId",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE i."tenantId" = t.id
  AND t."userId" IS NOT NULL
  AND i."userId" IS DISTINCT FROM t."userId";

UPDATE "Payment" p
SET "userId" = t."userId",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Tenant" t
WHERE p."tenantId" = t.id
  AND t."userId" IS NOT NULL
  AND p."userId" IS DISTINCT FROM t."userId";

INSERT INTO "Invoice" (
  id,
  code,
  period,
  "dueDate",
  amount,
  status,
  "paidAt",
  "leaseId",
  "tenantId",
  "userId",
  "createdAt",
  "updatedAt"
)
SELECT
  'inv_' || substr(md5(random()::text || clock_timestamp()::text || l.id), 1, 24),
  'CANON-' || upper(right(l.id, 8)) || '-' || to_char(date_trunc('month', CURRENT_DATE), 'YYYY-MM'),
  date_trunc('month', CURRENT_DATE),
  CURRENT_DATE + INTERVAL '5 days',
  COALESCE(l."expectedMonthlyPayment", p."monthlyRent"),
  'PENDING',
  NULL,
  l.id,
  l."tenantId",
  l."userId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Lease" l
JOIN "Property" p ON p.id = l."propertyId"
WHERE l.active = true
  AND l."tenantId" IS NOT NULL
  AND COALESCE(l."expectedMonthlyPayment", p."monthlyRent") > 0
  AND NOT EXISTS (
    SELECT 1
    FROM "Invoice" existing
    WHERE existing."leaseId" = l.id
      AND date_trunc('month', existing.period) = date_trunc('month', CURRENT_DATE)
  );
