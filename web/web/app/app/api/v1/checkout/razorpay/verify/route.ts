import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/api/razorpay";

export const dynamic = "force-dynamic";

/**
 * POST { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * Called by the Flutter app after a successful Razorpay checkout.
 * Verifies the signature server-side and marks the order as paid.
 */
export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const order = await db.order.findFirst({ where: { id: orderId, userId: u.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { keySecret } = await getRazorpayClient();
  const ok = verifyRazorpaySignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    keySecret,
  });

  if (!ok) {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paymentId:     razorpayPaymentId,
      paymentMethod: "razorpay",
      status:        order.status === "PENDING" ? "CONFIRMED" : order.status,
    },
  });

  return NextResponse.json({ success: true, order: updated });
}
