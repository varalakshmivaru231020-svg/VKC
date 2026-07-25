import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateReturnNumber } from "@/lib/returnNumber";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/orders/{id}/returns — admin raises a return on behalf of a customer.
 *
 * Body: { items: [{ orderItemId, quantity }], reason, remark?, refundMethod? }
 *
 * Mirrors the customer endpoint but bypasses the return-window policy and
 * records `raisedBy = ADMIN` so the audit trail is clear. Items must still
 * exist on the order and not exceed remaining (non-rejected) quantity.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: { items: true, returns: { include: { items: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    if (!oi) return NextResponse.json({ error: `Item ${it.orderItemId} not found in order` }, { status: 400 });
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
      raisedBy:     "ADMIN",
      raisedById:   (session.user as any).id,
      items: {
        create: items.map((it) => ({ orderItemId: it.orderItemId, quantity: it.quantity })),
      },
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

  return NextResponse.json({ return: created });
}

/** GET — list all returns for this order (admin view).
 *
 * Also includes the customer's current wallet balance and the computed
 * refund amount per return (sum of items' unit price × returned qty), so
 * the admin refund screen can preview the projected new balance for a
 * wallet refund without an extra round-trip. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const order = await db.order.findUnique({
    where: { id: params.id },
    select: { userId: true, orderNumber: true },
  });
  const returns = await db.orderReturn.findMany({
    where: { orderId: params.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { orderItem: { select: {
      productName: true, variantColor: true, sareeCode: true, imageUrl: true,
      totalPrice: true, quantity: true,
    } } } } },
  });

  const wallet = order?.userId
    ? await db.wallet.findUnique({ where: { userId: order.userId }, select: { balance: true } })
    : null;
  const walletBalance = wallet ? Number(wallet.balance) : 0;

  const withAmount = returns.map((r) => {
    let amount = 0;
    for (const it of r.items) {
      const oi: any = it.orderItem;
      const unit = Number(oi.totalPrice) / Math.max(1, oi.quantity);
      amount += unit * it.quantity;
    }
    amount = Math.round(amount * 100) / 100;
    return { ...r, refundAmount: amount };
  });

  return NextResponse.json({ returns: withAmount, walletBalance });
}
