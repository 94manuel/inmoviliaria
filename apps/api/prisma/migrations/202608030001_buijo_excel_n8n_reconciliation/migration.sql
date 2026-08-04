-- Integración BUIJO: Excel normalizado, conciliación Bancolombia/n8n y entidades de auditoría.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeaseStatus') THEN
    CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'ENDED', 'PRENOTICE', 'LEGAL_REVIEW');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeasePartyRole') THEN
    CREATE TYPE "LeasePartyRole" AS ENUM ('CO_TENANT', 'GUARANTOR', 'AUTHORIZED_PAYER', 'OCCUPANT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BankNotificationStatus') THEN
    CREATE TYPE "BankNotificationStatus" AS ENUM ('RECEIVED', 'MATCHED', 'REVIEW_REQUIRED', 'REJECTED', 'DUPLICATE', 'ERROR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportBatchStatus') THEN
    CREATE TYPE "ImportBatchStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_REVIEW', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportRecordStatus') THEN
    CREATE TYPE "ImportRecordStatus" AS ENUM ('IMPORTED', 'REVIEW_REQUIRED', 'SKIPPED', 'ERROR');
  END IF;
END $$;

ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'BANCOLOMBIA_EMAIL';
ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'MANUAL';

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "Property"
  ADD COLUMN IF NOT EXISTS "legacyCode" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceSheet" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceRow" INTEGER,
  ADD COLUMN IF NOT EXISTS "locality" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "rawAddress" TEXT;
ALTER TABLE "Property" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "Property" ALTER COLUMN "monthlyRent" SET DEFAULT 0;
ALTER TABLE "Property" ALTER COLUMN "city" SET DEFAULT 'Bogotá D.C.';
ALTER TABLE "Property" ALTER COLUMN "neighborhood" SET DEFAULT '';
ALTER TABLE "Property" ALTER COLUMN "bedrooms" SET DEFAULT 0;
ALTER TABLE "Property" ALTER COLUMN "bathrooms" SET DEFAULT 0;
ALTER TABLE "Property" ALTER COLUMN "areaM2" SET DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS "Property_legacyCode_key" ON "Property"("legacyCode");
CREATE INDEX IF NOT EXISTS "Property_status_city_idx" ON "Property"("status", "city");

CREATE TABLE "Owner" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "documentNumber" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Owner_normalizedName_key" ON "Owner"("normalizedName");

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "sourceKey" TEXT,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "documentNumber" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_sourceKey_key" ON "Tenant"("sourceKey");
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");
CREATE INDEX "Tenant_normalizedName_idx" ON "Tenant"("normalizedName");
CREATE INDEX "Tenant_documentNumber_idx" ON "Tenant"("documentNumber");
CREATE INDEX "Tenant_email_idx" ON "Tenant"("email");
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantAlias" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantAlias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantAlias_tenantId_normalizedAlias_key" ON "TenantAlias"("tenantId", "normalizedAlias");
CREATE INDEX "TenantAlias_normalizedAlias_idx" ON "TenantAlias"("normalizedAlias");
ALTER TABLE "TenantAlias" ADD CONSTRAINT "TenantAlias_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PropertyOwner" (
  "propertyId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "monthlyExpectedPayout" INTEGER,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyOwner_pkey" PRIMARY KEY ("propertyId", "ownerId")
);
ALTER TABLE "PropertyOwner" ADD CONSTRAINT "PropertyOwner_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PropertyOwner" ADD CONSTRAINT "PropertyOwner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lease" DROP CONSTRAINT "Lease_userId_fkey";
ALTER TABLE "Lease"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "startDate" DROP NOT NULL,
  ALTER COLUMN "endDate" DROP NOT NULL,
  ADD COLUMN "legacyCode" TEXT,
  ADD COLUMN "sourceSheet" TEXT,
  ADD COLUMN "sourceRow" INTEGER,
  ADD COLUMN "tenantId" TEXT,
  ADD COLUMN "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "expectedMonthlyPayment" INTEGER,
  ADD COLUMN "ownerExpectedPayout" INTEGER,
  ADD COLUMN "rawContractData" TEXT,
  ADD COLUMN "rawCoTenants" TEXT,
  ADD COLUMN "novelty" TEXT,
  ADD COLUMN "observations" TEXT;
CREATE UNIQUE INDEX "Lease_legacyCode_key" ON "Lease"("legacyCode");
CREATE INDEX "Lease_active_status_idx" ON "Lease"("active", "status");
CREATE INDEX "Lease_expectedMonthlyPayment_idx" ON "Lease"("expectedMonthlyPayment");
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LeaseParty" (
  "id" TEXT NOT NULL,
  "leaseId" TEXT NOT NULL,
  "role" "LeasePartyRole" NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "documentNumber" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "rawData" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaseParty_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LeaseParty_leaseId_role_idx" ON "LeaseParty"("leaseId", "role");
CREATE INDEX "LeaseParty_normalizedName_idx" ON "LeaseParty"("normalizedName");
ALTER TABLE "LeaseParty" ADD CONSTRAINT "LeaseParty_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LeasePayerAlias" (
  "id" TEXT NOT NULL,
  "leaseId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeasePayerAlias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeasePayerAlias_leaseId_normalizedAlias_key" ON "LeasePayerAlias"("leaseId", "normalizedAlias");
CREATE INDEX "LeasePayerAlias_normalizedAlias_idx" ON "LeasePayerAlias"("normalizedAlias");
ALTER TABLE "LeasePayerAlias" ADD CONSTRAINT "LeasePayerAlias_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ReceivingBankAccount" (
  "id" TEXT NOT NULL,
  "bank" TEXT NOT NULL DEFAULT 'Bancolombia',
  "label" TEXT NOT NULL,
  "accountLast4" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceivingBankAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReceivingBankAccount_bank_accountLast4_key" ON "ReceivingBankAccount"("bank", "accountLast4");

CREATE TABLE "LeaseReceivingAccount" (
  "leaseId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeaseReceivingAccount_pkey" PRIMARY KEY ("leaseId", "accountId")
);
ALTER TABLE "LeaseReceivingAccount" ADD CONSTRAINT "LeaseReceivingAccount_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaseReceivingAccount" ADD CONSTRAINT "LeaseReceivingAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ReceivingBankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userId_fkey";
ALTER TABLE "Invoice"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "tenantId" TEXT;
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");
CREATE INDEX "Invoice_tenantId_period_idx" ON "Invoice"("tenantId", "period");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";
ALTER TABLE "Payment"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "payerName" TEXT,
  ADD COLUMN "payerNameNormalized" TEXT,
  ADD COLUMN "bankAccountLast4" TEXT,
  ADD COLUMN "bankReference" TEXT,
  ADD COLUMN "tenantId" TEXT;
CREATE INDEX "Payment_invoiceId_status_idx" ON "Payment"("invoiceId", "status");
CREATE INDEX "Payment_bankReference_idx" ON "Payment"("bankReference");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "BankPaymentNotification" (
  "id" TEXT NOT NULL,
  "outlookMessageId" TEXT NOT NULL,
  "internetMessageId" TEXT,
  "sender" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "payerName" TEXT,
  "payerNameNormalized" TEXT,
  "amount" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'COP',
  "accountLast4" TEXT,
  "bankReference" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "status" "BankNotificationStatus" NOT NULL DEFAULT 'RECEIVED',
  "reviewReason" TEXT,
  "rawPayload" JSONB,
  "accountId" TEXT,
  "matchedLeaseId" TEXT,
  "matchedInvoiceId" TEXT,
  "paymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankPaymentNotification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BankPaymentNotification_outlookMessageId_key" ON "BankPaymentNotification"("outlookMessageId");
CREATE UNIQUE INDEX "BankPaymentNotification_paymentId_key" ON "BankPaymentNotification"("paymentId");
CREATE INDEX "BankPaymentNotification_status_receivedAt_idx" ON "BankPaymentNotification"("status", "receivedAt");
CREATE INDEX "BankPaymentNotification_payerNameNormalized_amount_idx" ON "BankPaymentNotification"("payerNameNormalized", "amount");
ALTER TABLE "BankPaymentNotification" ADD CONSTRAINT "BankPaymentNotification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ReceivingBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BankPaymentNotification" ADD CONSTRAINT "BankPaymentNotification_matchedLeaseId_fkey" FOREIGN KEY ("matchedLeaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BankPaymentNotification" ADD CONSTRAINT "BankPaymentNotification_matchedInvoiceId_fkey" FOREIGN KEY ("matchedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BankPaymentNotification" ADD CONSTRAINT "BankPaymentNotification_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ImportBatch" (
  "id" TEXT NOT NULL,
  "sourceFile" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "status" "ImportBatchStatus" NOT NULL DEFAULT 'PROCESSING',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "importedRows" INTEGER NOT NULL DEFAULT 0,
  "reviewRows" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportBatch_checksum_key" ON "ImportBatch"("checksum");

CREATE TABLE "ImportRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceSheet" TEXT NOT NULL,
  "sourceRow" INTEGER NOT NULL,
  "legacyCode" TEXT,
  "status" "ImportRecordStatus" NOT NULL,
  "entityId" TEXT,
  "reviewReason" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportRecord_batchId_sourceSheet_sourceRow_key" ON "ImportRecord"("batchId", "sourceSheet", "sourceRow");
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
