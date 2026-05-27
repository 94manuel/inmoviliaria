DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'PaymentProvider' AND e.enumlabel = 'CYBERVESTIGIO'
  ) THEN
    ALTER TYPE "PaymentProvider" ADD VALUE 'CYBERVESTIGIO';
  END IF;
END $$;

CREATE TYPE "ChargeCatalogType" AS ENUM ('SERVICE', 'PRODUCT');

CREATE TABLE "ChargeCatalogItem" (
  "id" TEXT NOT NULL,
  "type" "ChargeCatalogType" NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChargeCatalogItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChargeCatalogItem_code_key" ON "ChargeCatalogItem"("code");

CREATE TABLE "InvoiceLineItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL,
  "total" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InvoiceLineItem_invoiceId_catalogItemId_key" ON "InvoiceLineItem"("invoiceId", "catalogItemId");

ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "ChargeCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
