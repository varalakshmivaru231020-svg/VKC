-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'RETURN_PICKUP_ASSIGNED';
ALTER TYPE "OrderStatus" ADD VALUE 'RETURN_PICKUP_COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE 'RETURN_DELIVERED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "returnDeliveredAt" TIMESTAMP(3),
ADD COLUMN     "returnPickedUpAt" TIMESTAMP(3),
ADD COLUMN     "returnPickedUpNotes" VARCHAR(1000),
ADD COLUMN     "returnPickupCourier" VARCHAR(100),
ADD COLUMN     "returnPickupTracking" VARCHAR(100),
ADD COLUMN     "returnRefundNotes" VARCHAR(1000);
