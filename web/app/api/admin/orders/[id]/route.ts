import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    action, status, trackingNumber, trackingUrl, courierPartner,
    pickupCourier, pickupTracking, pickupNotes, refundNote,
  } = body;

  // ── PROCESS REFUND (cancel / return) ──────────────────────────────────────
  if (action === "process_refund") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isCancelRefund = order.status === "CANCELLED";
    const isReturnRefund = order.status === "RETURN_APPROVED" || order.status === "RETURN_DELIVERED";
    if (!isCancelRefund && !isReturnRefund) {
      return NextResponse.json({ error: "Refund not applicable for current status" }, { status: 400 });
    }

    const refundMethod = isCancelRefund ? order.cancelRefundMethod : order.returnRefundMethod;
    const refundAmount = Number(order.totalAmount);

    if (refundMethod === "WALLET" && order.userId) {
      // Credit wallet
      await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId: order.userId! } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: order.userId!, balance: 0 } });
        }
        const newBalance = Number(wallet.balance) + refundAmount;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: refundAmount,
            balance: newBalance,
            reason: isCancelRefund
              ? `Refund for cancelled order #${order.orderNumber}`
              : `Refund for returned order #${order.orderNumber}`,
            orderId: order.id,
            adminId: (session.user as any).id,
          },
        });
      });
    }

    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: "REFUNDED",
        returnProcessedAt: isReturnRefund ? new Date() : undefined,
        returnRefundNotes: isReturnRefund && refundNote ? refundNote : undefined,
      },
    });
    return NextResponse.json({ order: updated });
  }

  // ── ASSIGN RETURN PICKUP ──────────────────────────────────────────────────
  // Step 1 of the return workflow: admin schedules a courier to pick up
  // the item from the customer.
  if (action === "assign_return_pickup") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "RETURN_REQUESTED") {
      return NextResponse.json({ error: "Pickup can be assigned only after a return is requested" }, { status: 400 });
    }
    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        status: "RETURN_PICKUP_ASSIGNED",
        returnPickupCourier:  pickupCourier  || null,
        returnPickupTracking: pickupTracking || null,
      },
    });
    return NextResponse.json({ order: updated });
  }

  // ── COMPLETE RETURN PICKUP ────────────────────────────────────────────────
  // Step 2: courier has picked up the item from the customer. Admin records
  // any pickup notes (condition of item, missing accessories, etc.).
  if (action === "complete_return_pickup") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "RETURN_PICKUP_ASSIGNED") {
      return NextResponse.json({ error: "Pickup must be assigned first" }, { status: 400 });
    }
    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        status: "RETURN_PICKUP_COMPLETED",
        returnPickedUpAt:    new Date(),
        returnPickedUpNotes: pickupNotes || null,
      },
    });
    return NextResponse.json({ order: updated });
  }

  // ── MARK RETURN DELIVERED TO WAREHOUSE ────────────────────────────────────
  // Step 3: parcel has reached the warehouse. Inventory is replenished here
  // so it's available for sale before the refund is processed.
  if (action === "mark_return_delivered") {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "RETURN_PICKUP_COMPLETED") {
      return NextResponse.json({ error: "Pickup must be completed first" }, { status: 400 });
    }
    const updated = await db.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data:  { stockQty: { increment: item.quantity } },
        }).catch(() => {});
      }
      return tx.order.update({
        where: { id: params.id },
        data: {
          status: "RETURN_DELIVERED",
          returnDeliveredAt: new Date(),
        },
      });
    });
    return NextResponse.json({ order: updated });
  }

  // ── APPROVE RETURN (legacy direct-approve, also restocks) ─────────────────
  // Kept so historical RETURN_REQUESTED orders that bypassed the pickup
  // workflow can still be moved forward. New flow uses the three steps above.
  if (action === "approve_return") {
    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!["RETURN_REQUESTED", "RETURN_DELIVERED"].includes(order.status)) {
      return NextResponse.json({ error: "Order not in a state that can be approved for return" }, { status: 400 });
    }
    const updated = await db.$transaction(async (tx) => {
      // Only restock if we haven't already (i.e. status was RETURN_REQUESTED).
      if (order.status === "RETURN_REQUESTED") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data:  { stockQty: { increment: item.quantity } },
          }).catch(() => {});
        }
      }
      return tx.order.update({
        where: { id: params.id },
        data: { status: "RETURN_APPROVED" },
      });
    });
    return NextResponse.json({ order: updated });
  }

  // Exchange flow has been removed.
  if (action === "approve_exchange") {
    return NextResponse.json({ error: "Exchange flow has been removed" }, { status: 410 });
  }

  // ── STATUS / TRACKING UPDATE ──────────────────────────────────────────────
  const validStatuses = [
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED",
    "CANCELLED", "REFUNDED",
    "RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED",
    "RETURN_DELIVERED", "RETURN_APPROVED",
    "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED",
  ];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const data: any = {};
  if (status) {
    data.status = status;
    if (status === "SHIPPED") data.shippedAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
    if (status === "CANCELLED") data.cancelledAt = new Date();
  }
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null;
  if (trackingUrl !== undefined) data.trackingUrl = trackingUrl || null;
  if (courierPartner !== undefined) data.courierPartner = courierPartner || null;

  // If the admin is moving an order to CANCELLED that was previously not
  // cancelled, release the reserved variant stock back to inventory (same
  // behaviour as the customer-facing cancel endpoint).
  if (status === "CANCELLED") {
    const existing = await db.order.findUnique({
      where: { id: params.id },
      select: { status: true, items: { select: { variantId: true, quantity: true } } },
    });
    if (existing && existing.status !== "CANCELLED") {
      await db.$transaction(async (tx) => {
        for (const item of existing.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data:  { stockQty: { increment: item.quantity } },
          }).catch(() => {});
        }
        await tx.order.update({ where: { id: params.id }, data });
      });
      const updated = await db.order.findUnique({ where: { id: params.id } });
      return NextResponse.json({ order: updated });
    }
  }

  const order = await db.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}
