import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseISTDateTimeLocal } from "@/lib/utils/format";

export async function POST(req: NextRequest) {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, startsAt, expiresAt, isActive } = await req.json();

    if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "Type is required" }, { status: 400 });
    if (value === undefined || value === "") return NextResponse.json({ error: "Value is required" }, { status: 400 });

    const coupon = await db.coupon.create({
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
