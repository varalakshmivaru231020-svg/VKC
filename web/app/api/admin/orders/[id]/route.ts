import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, status, trackingNumber, trackingUrl, courierPartner } = body;

  // ── PROCESS REFUND (cancel / return) ──────────────────────────────────────
  if (action === "process_refund") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isCancelRefund = order.status === "CANCELLED";
    const isReturnRefund = order.status === "RETURN_APPROVED";
    if (!isCancelRefund && !isReturnRefund) {
      return NextResponse.json({ error: "Refund not applicable for current status" }, { status: 400 });
    }

    const refundMethod = isCancelRefund ? order.cancelRefundMethod : order.returnRefundMethod;
    const refundAmount = Number(order.totalAmount);

    if (refundMethod === "WALLET" && order.userId) {
      // Credit wallet
      await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId: order.userId! } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: order.userId!, balance: 0 } });
        }
        const newBalance = Number(wallet.balance) + refundAmount;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: refundAmount,
            balance: newBalance,
            reason: isCancelRefund
              ? `Refund for cancelled order #${order.orderNumber}`
              : `Refund for returned order #${order.orderNumber}`,
            orderId: order.id,
            adminId: (session.user as any).id,
          },
        });
      });
    }

    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        paymentStatus: "REFUNDED",
        returnProcessedAt: isReturnRefund ? new Date() : undefined,
      },
    });
    return NextResponse.json({ order: updated });
  }

  // ── APPROVE RETURN ────────────────────────────────────────────────────────
  if (action === "approve_return") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "RETURN_REQUESTED") {
      return NextResponse.json({ error: "No return request pending" }, { status: 400 });
    }
    const updated = await db.order.update({
      where: { id: params.id },
      data: { status: "RETURN_APPROVED" },
    });
    return NextResponse.json({ order: updated });
  }

  // ── APPROVE EXCHANGE ──────────────────────────────────────────────────────
  if (action === "approve_exchange") {
    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (order.status !== "EXCHANGE_REQUESTED") {
      return NextResponse.json({ error: "No exchange request pending" }, { status: 400 });
    }
    // Credit wallet immediately on exchange approval
    if (order.userId) {
      const refundAmount = Number(order.totalAmount);
      await db.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId: order.userId! } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: order.userId!, balance: 0 } });
        }
        const newBalance = Number(wallet.balance) + refundAmount;
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CREDIT",
            amount: refundAmount,
            balance: newBalance,
            reason: `Exchange credit for order #${order.orderNumber}`,
            orderId: order.id,
            adminId: (session.user as any).id,
          },
        });
      });
    }
    const updated = await db.order.update({
      where: { id: params.id },
      data: {
        status: "EXCHANGE_APPROVED",
        paymentStatus: "REFUNDED",
        returnProcessedAt: new Date(),
      },
    });
    return NextResponse.json({ order: updated });
  }

  // ── STATUS / TRACKING UPDATE ──────────────────────────────────────────────
  const validStatuses = [
    "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED",
    "CANCELLED", "REFUNDED", "RETURN_REQUESTED", "RETURN_APPROVED",
    "EXCHANGE_REQUESTED", "EXCHANGE_APPROVED",
  ];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const data: any = {};
  if (status) {
    data.status = status;
    if (status === "SHIPPED") data.shippedAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
    if (status === "CANCELLED") data.cancelledAt = new Date();
  }
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null;
  if (trackingUrl !== undefined) data.trackingUrl = trackingUrl || null;
  if (courierPartner !== undefined) data.courierPartner = courierPartner || null;

  const order = await db.order.update({ where: { id: params.id }, data });
  return NextResponse.json({ order });
}
