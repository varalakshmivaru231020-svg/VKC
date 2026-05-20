-- AlterTable: orders — add Shiprocket tracking columns
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "shiprocketOrderId"    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "shiprocketShipmentId" VARCHAR(50);
