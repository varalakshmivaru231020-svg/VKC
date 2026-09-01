-- Additive schema reconciliation for the local `vijaylakshmi` DB.
-- Generated from `prisma migrate diff` (DB -> schema). Every statement is
-- additive; the diff's only destructive step (DROP TABLE theme_presets) is
-- deliberately omitted — Prisma ignores tables not in its schema, so the
-- orphan table is harmless and its one row is kept (also backed up in
-- scripts/theme_presets_backup.sql). Idempotent via IF NOT EXISTS guards.
--
-- Note: the pre-booking feature was removed. Its columns/enums are dropped by
-- scripts/drop-prebooking.sql, so they are intentionally NOT recreated here.

ALTER TABLE "hero_slides"      ADD COLUMN IF NOT EXISTS "mobileImageUrl" VARCHAR(500);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "anniversary" DATE,
  ADD COLUMN IF NOT EXISTS "dob" DATE,
  ADD COLUMN IF NOT EXISTS "motherTongue" VARCHAR(50);

ALTER TABLE "video_bookings"   ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "video_bookings_userId_idx" ON "video_bookings"("userId");

DO $$ BEGIN
  ALTER TABLE "video_bookings" ADD CONSTRAINT "video_bookings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
