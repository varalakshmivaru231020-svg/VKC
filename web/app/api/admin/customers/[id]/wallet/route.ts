import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function adminOnly() {
  const s = await auth();
  return (s?.user as any)?.role === "ADMIN" ? null : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const err = await adminOnly(); if (err) return err;
  const { type, amount, reason } = await req.json();
  const session = await auth();
  const adminId = (session?.user as any)?.id;

  if (!type || !amount || amount <= 0) {
    return NextResponse.json({ error: "type and positive amount required" }, { status: 400 });
  }

  const wallet = await db.$transaction(async (tx) => {
    let w = await tx.wallet.findUnique({ where: { userId: params.id } });
    if (!w) w = await tx.wallet.create({ data: { userId: params.id, balance: 0 } });

    const delta = type === "CREDIT" ? Number(amount) : -Number(amount);
    const newBalance = Number(w.balance) + delta;
    if (newBalance < 0) throw new Error("Insufficient wallet balance");

    const updated = await tx.wallet.update({
      where: { id: w.id },
      data: { balance: newBalance },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: w.id,
        type,
        amount: Number(amount),
        balance: newBalance,
        reason: reason || null,
        adminId,
      },
    });
    return updated;
  });

  return NextResponse.json(wallet);
}
