-- AlterTable: banners — add bannerType column
ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "bannerType" VARCHAR(50) NOT NULL DEFAULT 'PROMOTIONAL';
