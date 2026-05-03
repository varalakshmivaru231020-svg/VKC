import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

const RETURNABLE_STATUSES = ["DELIVERED"];

/** POST { type: "RETURN" | "EXCHANGE", reason: string, refundMethod?: "SOURCE" | "WALLET" } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { type, reason, remark, refundMethod } = await req.json();
  if (type !== "RETURN" && type !== "EXCHANGE") {
    return NextResponse.json({ error: "type must be RETURN or EXCHANGE" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }
  const finalReason = remark ? `${reason} — ${remark}` : reason;

  const order = await db.order.findFirst({ where: { id: params.id, userId: u.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!RETURNABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: `Returns/exchanges allowed only after delivery (current: ${order.status})` }, { status: 400 });
  }

  // Enforce return window from the admin-configured policy.
  const policyRow = await db.siteSetting.findUnique({ where: { key: "return_period_days" } });
  const returnPolicyDays = Math.max(0, parseInt(policyRow?.value ?? "7"));
  const deliveredAt = order.deliveredAt;
  if (deliveredAt) {
    const deadline = new Date(deliveredAt.getTime() + returnPolicyDays * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) {
      return NextResponse.json({
        error: `Return window of ${returnPolicyDays} days has passed`,
      }, { status: 400 });
    }
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status:             type === "RETURN" ? "RETURN_REQUESTED" : "EXCHANGE_REQUESTED",
      returnReason:       finalReason,
      returnType:         type,
      returnRefundMethod: type === "RETURN" ? (refundMethod ?? "SOURCE") : null,
      returnRequestedAt:  new Date(),
    },
  });

  return NextResponse.json({
    order: updated,
    message: type === "RETURN"
      ? "Return request raised. Our team will arrange a pickup; the refund will be processed once the item reaches our warehouse."
      : "Exchange request raised. Our team will arrange a pickup and confirm the replacement once the item reaches our warehouse.",
  });
}
