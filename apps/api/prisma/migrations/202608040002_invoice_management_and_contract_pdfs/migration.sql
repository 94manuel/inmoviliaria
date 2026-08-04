-- Gestión administrativa de facturas y contratos firmados en PDF.

ALTER TYPE "StoredFilePurpose" ADD VALUE IF NOT EXISTS 'LEASE_CONTRACT';

ALTER TABLE "Lease"
  ADD COLUMN IF NOT EXISTS "contractFileId" TEXT,
  ADD COLUMN IF NOT EXISTS "contractUploadedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Lease_contractFileId_key"
  ON "Lease"("contractFileId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Lease_contractFileId_fkey'
  ) THEN
    ALTER TABLE "Lease"
      ADD CONSTRAINT "Lease_contractFileId_fkey"
      FOREIGN KEY ("contractFileId") REFERENCES "StoredFile"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "adminNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedReason" TEXT;

CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_status_dueDate_idx"
  ON "Invoice"("deletedAt", "status", "dueDate");
