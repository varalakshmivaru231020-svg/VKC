import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseISTDateTimeLocal } from "@/lib/utils/format";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, startsAt, expiresAt, isActive } = await req.json();

    if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const coupon = await db.coupon.update({
      where: { id: params.id },
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value) || 0,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        startsAt: parseISTDateTimeLocal(startsAt),
        expiresAt: parseISTDateTimeLocal(expiresAt),
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json(coupon);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.coupon.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
