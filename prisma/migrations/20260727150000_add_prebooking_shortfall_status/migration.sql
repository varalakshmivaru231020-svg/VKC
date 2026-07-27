-- CreateEnum
CREATE TYPE "PreBookingStatus" AS ENUM ('PENDING_APPROVAL', 'ACCEPTED', 'WAITING_FOR_STOCK', 'STOCK_AVAILABLE', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "availableAtBooking" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "preBookingStatus" "PreBookingStatus";

