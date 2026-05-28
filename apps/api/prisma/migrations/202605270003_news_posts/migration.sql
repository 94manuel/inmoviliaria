CREATE TABLE "NewsPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "externalUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");
CREATE INDEX "NewsPost_published_createdAt_idx" ON "NewsPost"("published", "createdAt");

ALTER TABLE "NewsPost"
ADD CONSTRAINT "NewsPost_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;