import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCashfreePayments } from "@/lib/api/cashfree";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orderNumber = new URL(req.url).searchParams.get("order");
  if (!orderNumber) return NextResponse.json({ error: "Missing order" }, { status: 400 });

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already marked as paid — return success immediately
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ success: true, orderNumber, status: "PAID" });
  }

  try {
    const { status, paymentId } = await getCashfreePayments(orderNumber);

    if (status === "SUCCESS") {
      await db.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: "PAID",
          paymentId:     paymentId ?? undefined,
          status:        order.status === "PENDING" ? "CONFIRMED" : order.status,
        },
      });
      return NextResponse.json({ success: true, orderNumber, status: "PAID" });
    }

    return NextResponse.json({ success: false, orderNumber, status });
  } catch {
    return NextResponse.json({ success: false, orderNumber, status: "PENDING" });
  }
}
