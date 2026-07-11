-- AlterTable
ALTER TABLE "order_returns" ADD COLUMN     "pickedUpById" TEXT,
ADD COLUMN     "pickupAssignedAt" TIMESTAMP(3),
ADD COLUMN     "pickupAssignedById" TEXT,
ADD COLUMN     "refundedById" TEXT,
ADD COLUMN     "returnNumber" VARCHAR(40),
ADD COLUMN     "warehouseById" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedById" TEXT,
ADD COLUMN     "deliveredById" TEXT,
ADD COLUMN     "processingAt" TIMESTAMP(3),
ADD COLUMN     "processingById" TEXT,
ADD COLUMN     "shippedById" TEXT;

-- AlterTable
ALTER TABLE "role_templates" ALTER COLUMN "permissions" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "order_returns_returnNumber_key" ON "order_returns"("returnNumber");
