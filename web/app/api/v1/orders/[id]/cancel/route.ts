import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"];

/** POST { reason, refundMethod?: "SOURCE" | "WALLET" } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { reason, refundMethod } = await req.json();
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "Cancel reason required" }, { status: 400 });
  }

  const order = await db.order.findFirst({ where: { id: params.id, userId: u.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!CANCELABLE_STATUSES.includes(order.status)) {
    return NextResponse.json({ error: `Order in status ${order.status} cannot be cancelled` }, { status: 400 });
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status:             "CANCELLED",
      cancelReason:       reason,
      cancelRefundMethod: refundMethod ?? "SOURCE",
      cancelledAt:        new Date(),
    },
  });
  return NextResponse.json({ order: updated });
}
