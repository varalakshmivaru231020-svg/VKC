-- Drop the pre-booking feature from the database (columns, index, enums).
-- The feature was fully removed from the app; this brings the schema in line.
-- Idempotent via IF EXISTS. Run against the local DB:
--   psql -U postgres -h 127.0.0.1 -d vijaylakshmi -f scripts/drop-prebooking.sql

DROP INDEX IF EXISTS "orders_orderType_createdAt_idx";

ALTER TABLE "orders"
  DROP COLUMN IF EXISTS "orderType",
  DROP COLUMN IF EXISTS "preBookingStatus",
  DROP COLUMN IF EXISTS "preBookingEtaDate",
  DROP COLUMN IF EXISTS "preBookingDisclaimerSnap",
  DROP COLUMN IF EXISTS "preBookingReturnsAllowedSnap";

ALTER TABLE "order_items"
  DROP COLUMN IF EXISTS "availableAtBooking";

ALTER TABLE "product_variants"
  DROP COLUMN IF EXISTS "preBookedQty";

ALTER TABLE "products"
  DROP COLUMN IF EXISTS "preBookingMode",
  DROP COLUMN IF EXISTS "preBookingEtaMinDays",
  DROP COLUMN IF EXISTS "preBookingEtaMaxDays",
  DROP COLUMN IF EXISTS "preBookingMaxQtyPerOrder",
  DROP COLUMN IF EXISTS "preBookingMaxTotalQty",
  DROP COLUMN IF EXISTS "preBookingDisclaimer",
  DROP COLUMN IF EXISTS "preBookingReturnsAllowed";

DROP TYPE IF EXISTS "PreBookingStatus";
DROP TYPE IF EXISTS "OrderType";
DROP TYPE IF EXISTS "PreBookingMode";
