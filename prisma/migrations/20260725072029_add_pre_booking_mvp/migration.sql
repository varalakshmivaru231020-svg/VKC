-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'PRE_BOOKING');

-- CreateEnum
CREATE TYPE "PreBookingMode" AS ENUM ('OFF', 'AUTO_ON_OUT_OF_STOCK', 'ALWAYS_ON');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "preBookingDisclaimerSnap" VARCHAR(500),
ADD COLUMN     "preBookingEtaDate" TIMESTAMP(3),
ADD COLUMN     "preBookingReturnsAllowedSnap" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "preBookedQty" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "preBookingDisclaimer" VARCHAR(500),
ADD COLUMN     "preBookingEtaMaxDays" INTEGER,
ADD COLUMN     "preBookingEtaMinDays" INTEGER,
ADD COLUMN     "preBookingMaxQtyPerOrder" INTEGER,
ADD COLUMN     "preBookingMaxTotalQty" INTEGER,
ADD COLUMN     "preBookingMode" "PreBookingMode" NOT NULL DEFAULT 'OFF',
ADD COLUMN     "preBookingReturnsAllowed" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "orders_orderType_createdAt_idx" ON "orders"("orderType", "createdAt" DESC);

