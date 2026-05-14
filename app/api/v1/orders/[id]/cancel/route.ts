import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

// Cancel allowed up to (and including) PROCESSING. Once SHIPPED the customer
// must use the return flow instead.
const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"];

/**
 * POST { reason, remark?, refundMethod?: "SOURCE" | "WALLET" }
 *
 * Cancels the order, releases the reserved variant stock back to inventory,
 * and (if paid by wallet) credits the wallet immediately. Refunds against
 * the original source require the admin to process them.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { reason, remark, refundMethod } = await req.json();
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "Cancel reason required" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: { id: params.id, userId: u.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!CANCELABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: `Order in status ${order.status} cannot be cancelled` }, { status: 400 });
  }

  const finalReason = remark ? `${reason} — ${remark}` : reason;

  const updated = await db.$transaction(async (tx) => {
    // 1) Mark cancelled
    const ord = await tx.order.update({
      where: { id: order.id },
      data: {
        status:             "CANCELLED",
        cancelReason:       finalReason,
        cancelRefundMethod: refundMethod ?? "SOURCE",
        cancelledAt:        new Date(),
      },
    });

    // 2) Release reserved stock back to each variant
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data:  { stockQty: { increment: item.quantity } },
      }).catch(() => {});
    }

    // 3) If paid via wallet, credit it back immediately. Otherwise admin handles refund.
    if (order.paymentStatus === "PAID" && refundMethod === "WALLET" && Number(order.totalAmount) > 0) {
      const wallet = await tx.wallet.upsert({
        where:  { userId: u.id },
        update: {},
        create: { userId: u.id, balance: 0 },
      });
      const newBalance = Number(wallet.balance) + Number(order.totalAmount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type:     "CREDIT",
          amount:   Number(order.totalAmount),
          balance:  newBalance,
          reason:   `Refund for cancelled order #${ord.orderNumber}`,
          orderId:  ord.id,
        },
      });
      await tx.order.update({ where: { id: ord.id }, data: { paymentStatus: "REFUNDED" } });
    }

    return ord;
  });

  return NextResponse.json({ order: updated });
}
