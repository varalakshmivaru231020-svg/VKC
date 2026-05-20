-- CreateEnum
CREATE TYPE "OrderReturnStatus" AS ENUM ('REQUESTED', 'PICKUP_ASSIGNED', 'PICKUP_COMPLETED', 'DELIVERED', 'REFUNDED', 'REJECTED');

-- CreateTable
CREATE TABLE "order_returns" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" VARCHAR(500) NOT NULL,
    "remark" TEXT,
    "refundMethod" VARCHAR(20),
    "refundMode" VARCHAR(50),
    "refundTxnId" VARCHAR(200),
    "refundNote" VARCHAR(1000),
    "refundedAt" TIMESTAMP(3),
    "pickupCourier" VARCHAR(100),
    "pickupTracking" VARCHAR(100),
    "pickedUpAt" TIMESTAMP(3),
    "pickedUpNotes" VARCHAR(1000),
    "deliveredAt" TIMESTAMP(3),
    "raisedBy" VARCHAR(20) NOT NULL,
    "raisedById" TEXT,
    "rejectionReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_return_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_returns_orderId_status_createdAt_idx" ON "order_returns"("orderId", "status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "order_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
