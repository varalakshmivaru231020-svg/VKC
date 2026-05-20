import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — list active coupons available to the storefront. Public. */
export async function GET() {
  const now = new Date();
  const coupons = await db.coupon.findMany({
    where: {
      isActive: true,
      OR:  [{ startsAt:  null }, { startsAt:  { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    },
    select: {
      code: true, type: true, value: true,
      minOrderAmount: true, maxDiscount: true,
      usageLimit: true, usedCount: true, expiresAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const available = coupons
    .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
    .map((c) => ({
      code:           c.code,
      type:           c.type,
      value:          Number(c.value),
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
      maxDiscount:    c.maxDiscount    ? Number(c.maxDiscount)    : null,
      expiresAt:      c.expiresAt ? c.expiresAt.toISOString() : null,
      description:
        c.type === "PERCENTAGE"
          ? `${Number(c.value)}% off${c.maxDiscount ? ` (max ₹${Number(c.maxDiscount).toLocaleString("en-IN")})` : ""}`
          : c.type === "FIXED"
          ? `₹${Number(c.value).toLocaleString("en-IN")} off`
          : "Free shipping on your order",
    }));

  return NextResponse.json({ coupons: available });
}
