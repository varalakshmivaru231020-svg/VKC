import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";
import { generateReturnNumber } from "@/lib/returnNumber";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/orders/{id}/returns
 *
 * Customer raises a return request for one or more items in their order.
 * Body: { items: [{ orderItemId, quantity }], reason, remark?, refundMethod? }
 *
 * Multiple returns are allowed against the same order over time (e.g. a
 * customer returns one saree now and another later). Each return is tracked
 * independently in the OrderReturn table with its own pickup workflow.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

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

  // Order must belong to the user, be DELIVERED, and within the return window.
  const order = await db.order.findFirst({
    where: { id: params.id, userId: u.id },
    include: { items: true, returns: { include: { items: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Returns are accepted only after delivery" }, { status: 400 });
  }

  const policyRow = await db.siteSetting.findUnique({ where: { key: "return_period_days" } });
  const days = Math.max(0, parseInt(policyRow?.value ?? "7"));
  if (order.deliveredAt && Date.now() - order.deliveredAt.getTime() > days * 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: `Return window of ${days} days has passed` }, { status: 400 });
  }

  // Validate each requested item belongs to this order, and that the requested
  // quantity doesn't exceed what's left after prior returns.
  const itemsById = new Map(order.items.map((i) => [i.id, i]));
  const alreadyReturned = new Map<string, number>();
  for (const r of order.returns) {
    if (r.status === "REJECTED") continue;
    for (const ri of r.items) {
      alreadyReturned.set(ri.orderItemId, (alreadyReturned.get(ri.orderItemId) ?? 0) + ri.quantity);
    }
  }
  for (const it of items) {
    const oi = itemsById.get(it.orderItemId);
    if (!oi) return NextResponse.json({ error: `Order item ${it.orderItemId} not found` }, { status: 400 });
    const available = oi.quantity - (alreadyReturned.get(oi.id) ?? 0);
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
      returnNumber: generateReturnNumber(),
      reason:       finalReason,
      remark:       remark || null,
      refundMethod: (refundMethod === "WALLET" ? "WALLET" : "SOURCE"),
      raisedBy:     "CUSTOMER",
      raisedById:   u.id,
      items: {
        create: items.map((it) => ({
          orderItemId: it.orderItemId,
          quantity:    it.quantity,
        })),
      },
    },
    include: { items: true },
  });

  // Reflect the latest return on the order's denormalised fields so legacy
  // UIs that still read order.status / order.returnReason keep working.
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
    message: "Return request raised. Our team will arrange a pickup; the refund will be processed once the item reaches our warehouse.",
  });
}

/** GET — list returns for this order. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const order = await db.order.findFirst({
    where: { id: params.id, userId: u.id },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const returns = await db.orderReturn.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ returns });
}
