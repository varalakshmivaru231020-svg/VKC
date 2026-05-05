import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/returns/{id}
 *
 * One endpoint, dispatched on `action`:
 *   - assign_pickup    { pickupCourier, pickupTracking }     REQUESTED → PICKUP_ASSIGNED
 *   - complete_pickup  { pickupNotes }                       PICKUP_ASSIGNED → PICKUP_COMPLETED + sets pickedUpAt
 *   - mark_delivered                                         PICKUP_COMPLETED → DELIVERED + restocks each item's variant
 *   - process_refund   { refundMode, refundTxnId, refundNote, refundMethod? }
 *                                                            DELIVERED → REFUNDED + records the refund details
 *                                                            (and credits wallet if method = WALLET)
 *   - reject           { reason }                             REQUESTED → REJECTED
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, ...body } = await req.json();
  const ret = await db.orderReturn.findUnique({
    where: { id: params.id },
    include: { items: { include: { orderItem: true } }, order: true },
  });
  if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── 1. Assign pickup courier ────────────────────────────────────────────
  if (action === "assign_pickup") {
    if (ret.status !== "REQUESTED") {
      return NextResponse.json({ error: "Pickup can be assigned only on a REQUESTED return" }, { status: 400 });
    }
    const updated = await db.orderReturn.update({
      where: { id: params.id },
      data: {
        status: "PICKUP_ASSIGNED",
        pickupCourier:  body.pickupCourier  || null,
        pickupTracking: body.pickupTracking || null,
      },
    });
    await db.order.update({ where: { id: ret.orderId }, data: { status: "RETURN_PICKUP_ASSIGNED" } });
    return NextResponse.json({ return: updated });
  }

  // ── 2. Mark pickup completed ────────────────────────────────────────────
  if (action === "complete_pickup") {
    if (ret.status !== "PICKUP_ASSIGNED") {
      return NextResponse.json({ error: "Pickup must be assigned first" }, { status: 400 });
    }
    const updated = await db.orderReturn.update({
      where: { id: params.id },
      data: {
        status: "PICKUP_COMPLETED",
        pickedUpAt:    new Date(),
        pickedUpNotes: body.pickupNotes || null,
      },
    });
    await db.order.update({ where: { id: ret.orderId }, data: { status: "RETURN_PICKUP_COMPLETED" } });
    return NextResponse.json({ return: updated });
  }

  // ── 3. Delivered to warehouse — restocks inventory ──────────────────────
  if (action === "mark_delivered") {
    if (ret.status !== "PICKUP_COMPLETED") {
      return NextResponse.json({ error: "Pickup must be completed first" }, { status: 400 });
    }
    const updated = await db.$transaction(async (tx) => {
      for (const it of ret.items) {
        await tx.productVariant.update({
          where: { id: it.orderItem.variantId },
          data:  { stockQty: { increment: it.quantity } },
        }).catch(() => {});
      }
      const r = await tx.orderReturn.update({
        where: { id: params.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
      await tx.order.update({ where: { id: ret.orderId }, data: { status: "RETURN_DELIVERED" } });
      return r;
    });
    return NextResponse.json({ return: updated });
  }

  // ── 4. Process refund ───────────────────────────────────────────────────
  if (action === "process_refund") {
    if (ret.status !== "DELIVERED") {
      return NextResponse.json({ error: "Refund can be processed only after the goods are delivered to warehouse" }, { status: 400 });
    }

    // Refund amount = sum of item totalPrice * (returned qty / ordered qty)
    let amount = 0;
    for (const it of ret.items) {
      const oi = it.orderItem;
      const unit = Number(oi.totalPrice) / Math.max(1, oi.quantity);
      amount += unit * it.quantity;
    }
    amount = Math.round(amount * 100) / 100;

    const refundMethod = (body.refundMethod || ret.refundMethod || "SOURCE") as "WALLET" | "SOURCE";

    const updated = await db.$transaction(async (tx) => {
      // Wallet credit if applicable
      if (refundMethod === "WALLET" && ret.order.userId) {
        const wallet = await tx.wallet.upsert({
          where:  { userId: ret.order.userId },
          update: {},
          create: { userId: ret.order.userId, balance: 0 },
        });
        const newBalance = Number(wallet.balance) + amount;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type:     "CREDIT",
            amount,
            balance:  newBalance,
            reason:   `Refund for return on order #${ret.order.orderNumber}`,
            orderId:  ret.orderId,
            adminId:  (session.user as any).id,
          },
        });
      }

      const r = await tx.orderReturn.update({
        where: { id: params.id },
        data: {
          status: "REFUNDED",
          refundMethod,
          refundMode:  body.refundMode  || null,
          refundTxnId: body.refundTxnId || null,
          refundNote:  body.refundNote  || null,
          refundedAt:  new Date(),
        },
      });

      // If every non-rejected return on this order is now refunded, move the
      // order's denormalised paymentStatus to REFUNDED.
      const remaining = await tx.orderReturn.count({
        where: {
          orderId: ret.orderId,
          status:  { notIn: ["REFUNDED", "REJECTED"] },
        },
      });
      if (remaining === 0) {
        await tx.order.update({
          where: { id: ret.orderId },
          data:  { paymentStatus: "REFUNDED", returnProcessedAt: new Date() },
        });
      }
      return r;
    });

    return NextResponse.json({ return: updated, refundedAmount: amount });
  }

  // ── 5. Reject ───────────────────────────────────────────────────────────
  if (action === "reject") {
    if (!["REQUESTED", "PICKUP_ASSIGNED"].includes(ret.status)) {
      return NextResponse.json({ error: "Can only reject a return before it's picked up" }, { status: 400 });
    }
    const updated = await db.orderReturn.update({
      where: { id: params.id },
      data: { status: "REJECTED", rejectionReason: body.reason || null },
    });
    return NextResponse.json({ return: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
