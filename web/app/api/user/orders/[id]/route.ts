import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await db.order.findFirst({
    where: { id: params.id, userId: uid },
    include: { items: true },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const uid = (session?.user as any)?.id;
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, reason, refundMethod } = body;

    const order = await db.order.findFirst({
      where: { id: params.id, userId: uid },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // ── CANCEL ──────────────────────────────────────────────────────────────
    if (action === "cancel") {
      if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        return NextResponse.json({ error: "Order cannot be cancelled at this stage" }, { status: 400 });
      }
      const isPaid = order.paymentStatus === "PAID";
      const updated = await db.order.update({
        where: { id: params.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: reason ?? null,
          cancelRefundMethod: isPaid ? (refundMethod ?? "SOURCE") : null,
        },
      });
      return NextResponse.json({ order: updated });
    }

    // ── RETURN REQUEST ───────────────────────────────────────────────────────
    if (action === "return") {
      if (order.status !== "DELIVERED") {
        return NextResponse.json({ error: "Return can only be requested after delivery" }, { status: 400 });
      }
      const updated = await db.order.update({
        where: { id: params.id },
        data: {
          status: "RETURN_REQUESTED",
          returnType: "RETURN",
          returnReason: reason ?? null,
          returnRefundMethod: refundMethod ?? "SOURCE",
          returnRequestedAt: new Date(),
        },
      });
      return NextResponse.json({ order: updated });
    }

    // ── EXCHANGE REQUEST ─────────────────────────────────────────────────────
    if (action === "exchange") {
      if (order.status !== "DELIVERED") {
        return NextResponse.json({ error: "Exchange can only be requested after delivery" }, { status: 400 });
      }
      const updated = await db.order.update({
        where: { id: params.id },
        data: {
          status: "EXCHANGE_REQUESTED",
          returnType: "EXCHANGE",
          returnReason: reason ?? null,
          returnRefundMethod: "WALLET",
          returnRequestedAt: new Date(),
        },
      });
      return NextResponse.json({ order: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[user/orders PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
