CREATE TYPE "StoredFilePurpose" AS ENUM ('PROPERTY_IMAGE', 'GENERIC');

CREATE TABLE "StoredFile" (
  "id" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "purpose" "StoredFilePurpose" NOT NULL DEFAULT 'GENERIC',
  "publicPath" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_objectKey_key" ON "StoredFile"("objectKey");
CREATE UNIQUE INDEX "StoredFile_publicPath_key" ON "StoredFile"("publicPath");
CREATE INDEX "StoredFile_purpose_createdAt_idx" ON "StoredFile"("purpose", "createdAt");

ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;