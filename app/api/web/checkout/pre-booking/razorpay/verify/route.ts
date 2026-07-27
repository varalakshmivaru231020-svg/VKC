import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/api/razorpay";
import { releasePreBookingSlot } from "@/lib/prebooking/reserveSlots";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = (session?.user as any)?.id ?? null;

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const where = userId ? { id: orderId, userId } : { id: orderId };
  const order = await db.order.findFirst({ where, include: { items: true } });
  if (!order || order.orderType !== "PRE_BOOKING") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { keySecret } = await getRazorpayClient();
  const ok = verifyRazorpaySignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    keySecret,
  });

  if (!ok) {
    // The booking never actually completed — free the slots it reserved so
    // an abandoned/failed payment attempt doesn't permanently eat capacity.
    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        // Only the shortfall (qty beyond what was in stock at booking time)
        // ever consumed pre-booking capacity — release exactly that, not the
        // full line quantity, or this would over-release into other orders'
        // reserved slots.
        const shortfall = Math.max(0, item.quantity - (item.availableAtBooking ?? 0));
        if (shortfall > 0) await releasePreBookingSlot(tx, item.variantId, shortfall);
      }
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paymentId:     razorpayPaymentId,
      paymentMethod: "razorpay",
      status:        order.status === "PENDING" ? "CONFIRMED" : order.status,
    },
  });

  return NextResponse.json({ success: true, orderNumber: order.orderNumber });
}
