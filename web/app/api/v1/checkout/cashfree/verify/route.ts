import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";
import { getCashfreePayments } from "@/lib/api/cashfree";

export const dynamic = "force-dynamic";

/**
 * POST { orderId, cashfreeOrderId }
 * Called by the Flutter app after the Cashfree checkout completes.
 * Polls Cashfree for payment status and marks the order as paid/failed.
 */
export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { orderId, cashfreeOrderId } = await req.json();
  if (!orderId || !cashfreeOrderId) {
    return NextResponse.json({ error: "orderId and cashfreeOrderId required" }, { status: 400 });
  }

  const order = await db.order.findFirst({ where: { id: orderId, userId: u.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const { status, paymentId } = await getCashfreePayments(cashfreeOrderId);

    if (status === "SUCCESS") {
      const updated = await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentId:     paymentId ?? cashfreeOrderId,
          paymentMethod: "cashfree",
          status:        order.status === "PENDING" ? "CONFIRMED" : order.status,
        },
      });
      return NextResponse.json({ success: true, order: updated });
    }

    if (status === "FAILED") {
      await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
      return NextResponse.json({ error: "Payment failed" }, { status: 400 });
    }

    return NextResponse.json({ success: false, status: "PENDING" });
  } catch (err: any) {
    console.error("[cashfree/verify]", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
