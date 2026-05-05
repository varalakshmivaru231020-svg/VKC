import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/orders/{id}/returns — web (cookie-auth) counterpart of the
 * v1 endpoint. Customer raises a return for one or more items in their order.
 *
 * Body: { items: [{ orderItemId, quantity }], reason, remark?, refundMethod? }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, reason, remark, refundMethod } = body as {
    items: Array<{ orderItemId: string; quantity: number }>;
    reason: string;
    remark?: string;
    refundMethod?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Pick at least one item to return" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: { id: params.id, userId },
    include: { items: true, returns: { include: { items: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "DELIVERED" &&
      !["RETURN_REQUESTED", "RETURN_PICKUP_ASSIGNED", "RETURN_PICKUP_COMPLETED", "RETURN_DELIVERED", "RETURN_APPROVED"].includes(order.status)) {
    return NextResponse.json({ error: "Returns are accepted only after delivery" }, { status: 400 });
  }

  const policyRow = await db.siteSetting.findUnique({ where: { key: "return_period_days" } });
  const days = Math.max(0, parseInt(policyRow?.value ?? "7"));
  if (order.deliveredAt && Date.now() - order.deliveredAt.getTime() > days * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: `Return window of ${days} days has passed` }, { status: 400 });
  }

  const itemsById = new Map(order.items.map((i) => [i.id, i]));
  const consumed = new Map<string, number>();
  for (const r of order.returns) {
    if (r.status === "REJECTED") continue;
    for (const ri of r.items) {
      consumed.set(ri.orderItemId, (consumed.get(ri.orderItemId) ?? 0) + ri.quantity);
    }
  }
  for (const it of items) {
    const oi = itemsById.get(it.orderItemId);
    if (!oi) return NextResponse.json({ error: "Item not in this order" }, { status: 400 });
    const available = oi.quantity - (consumed.get(oi.id) ?? 0);
    if (it.quantity < 1 || it.quantity > available) {
      return NextResponse.json({
        error: `Cannot return ${it.quantity} of "${oi.productName}" — only ${available} eligible`,
      }, { status: 400 });
    }
  }

  const finalReason = remark ? `${reason} — ${remark}` : reason;

  const created = await db.orderReturn.create({
    data: {
      orderId:      order.id,
      reason:       finalReason,
      remark:       remark || null,
      refundMethod: (refundMethod === "WALLET" ? "WALLET" : "SOURCE"),
      raisedBy:     "CUSTOMER",
      raisedById:   userId,
      items: { create: items.map((it) => ({ orderItemId: it.orderItemId, quantity: it.quantity })) },
    },
    include: { items: true },
  });

  await db.order.update({
    where: { id: order.id },
    data: {
      status:             "RETURN_REQUESTED",
      returnType:         "RETURN",
      returnReason:       finalReason,
      returnRefundMethod: created.refundMethod,
      returnRequestedAt:  new Date(),
    },
  });

  return NextResponse.json({
    return: created,
    message: "Return request raised. We'll arrange a pickup; refund is processed once the item reaches our warehouse.",
  });
}

/** GET — list this customer's returns for the order. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await db.order.findFirst({ where: { id: params.id, userId }, select: { id: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const returns = await db.orderReturn.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { orderItem: { select: { productName: true, variantColor: true, sareeCode: true, imageUrl: true } } } } },
  });
  return NextResponse.json({ returns });
}
