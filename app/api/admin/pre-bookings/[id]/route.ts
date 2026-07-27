import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = [
  "PENDING_APPROVAL", "ACCEPTED", "WAITING_FOR_STOCK", "STOCK_AVAILABLE",
  "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];

// Pre-booking stages that, once reached, should also mirror into the
// standard OrderStatus so invoices, customer order tracking, and the main
// Orders list (all of which read Order.status, not preBookingStatus) stay
// consistent — the pre-fulfillment stages (PENDING_APPROVAL/ACCEPTED/
// WAITING_FOR_STOCK/STOCK_AVAILABLE) have no equivalent OrderStatus and are
// left alone.
const STATUS_MIRROR: Record<string, string> = {
  PROCESSING: "PROCESSING",
  SHIPPED:    "SHIPPED",
  DELIVERED:  "DELIVERED",
  CANCELLED:  "CANCELLED",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { preBookingStatus, preBookingEtaDate } = body as { preBookingStatus?: string; preBookingEtaDate?: string | null };

  const existing = await db.order.findUnique({
    where: { id: params.id },
    select: { orderType: true, preBookingStatus: true, status: true, items: { select: { variantId: true, quantity: true, availableAtBooking: true } } },
  });
  if (!existing || existing.orderType !== "PRE_BOOKING") {
    return NextResponse.json({ error: "Pre-booking order not found" }, { status: 404 });
  }

  const data: any = {};
  if (preBookingEtaDate !== undefined) {
    data.preBookingEtaDate = preBookingEtaDate ? new Date(preBookingEtaDate) : null;
  }

  if (preBookingStatus !== undefined) {
    if (!VALID_STATUSES.includes(preBookingStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (existing.preBookingStatus === "CANCELLED" || existing.preBookingStatus === "DELIVERED") {
      return NextResponse.json({ error: `Cannot change status — order is already ${existing.preBookingStatus.toLowerCase()}` }, { status: 400 });
    }
    data.preBookingStatus = preBookingStatus;
    if (STATUS_MIRROR[preBookingStatus]) data.status = STATUS_MIRROR[preBookingStatus];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Cancelling releases whatever pre-booking capacity this order's shortfall
  // consumed — same accounting as the standard order-cancel path.
  if (preBookingStatus === "CANCELLED" && existing.status !== "CANCELLED") {
    await db.$transaction(async (tx) => {
      for (const item of existing.items) {
        const qty = Math.max(0, item.quantity - (item.availableAtBooking ?? 0));
        if (qty === 0) continue;
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { preBookedQty: { decrement: qty } },
        }).catch(() => {});
      }
      await tx.order.update({ where: { id: params.id }, data });
    });
  } else {
    await db.order.update({ where: { id: params.id }, data });
  }

  const updated = await db.order.findUnique({ where: { id: params.id } });
  return NextResponse.json({ order: updated });
}
