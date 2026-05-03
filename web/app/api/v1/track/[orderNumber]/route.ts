import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { orderNumber: string } }) {
  const order = await db.order.findFirst({
    where: { orderNumber: params.orderNumber.toUpperCase() },
    select: {
      orderNumber: true, status: true, paymentStatus: true,
      shippingAmount: true, totalAmount: true,
      trackingNumber: true, trackingUrl: true, courierPartner: true,
      shippedAt: true, deliveredAt: true, cancelledAt: true,
      createdAt: true, updatedAt: true,
      items: { select: { id: true, productName: true, variantColor: true, quantity: true, imageUrl: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}
