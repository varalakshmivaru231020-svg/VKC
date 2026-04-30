import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// List active, currently-valid coupons for the storefront picker
export async function GET() {
  const now = new Date();
  const coupons = await db.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    select: {
      code: true, type: true, value: true,
      minOrderAmount: true, maxDiscount: true,
      usageLimit: true, usedCount: true, expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter out exhausted coupons and shape for the UI
  const available = coupons
    .filter(c => c.usageLimit === null || c.usedCount < c.usageLimit)
    .map(c => ({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
      maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      description:
        c.type === "PERCENTAGE"
          ? `${Number(c.value)}% off${c.maxDiscount ? ` (max ₹${Number(c.maxDiscount).toLocaleString("en-IN")})` : ""}`
          : c.type === "FIXED"
          ? `₹${Number(c.value).toLocaleString("en-IN")} off`
          : "Free shipping on your order",
    }));

  return NextResponse.json(available);
}

// Validate and compute discount for a coupon code
export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
  }

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    return NextResponse.json({ error: "Coupon is not yet active" }, { status: 400 });
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }
  if (coupon.minOrderAmount && Number(subtotal) < Number(coupon.minOrderAmount)) {
    return NextResponse.json({
      error: `Minimum order amount ₹${Number(coupon.minOrderAmount).toLocaleString("en-IN")} required`,
    }, { status: 400 });
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (Number(subtotal) * Number(coupon.value)) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else if (coupon.type === "FIXED") {
    discount = Math.min(Number(coupon.value), Number(subtotal));
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discount: Math.round(discount * 100) / 100,
    freeShipping: coupon.type === "FREE_SHIPPING",
    description:
      coupon.type === "PERCENTAGE"
        ? `${Number(coupon.value)}% off${coupon.maxDiscount ? ` (max ₹${Number(coupon.maxDiscount).toLocaleString("en-IN")})` : ""}`
        : coupon.type === "FIXED"
        ? `₹${Number(coupon.value).toLocaleString("en-IN")} off`
        : "Free shipping",
  });
}
