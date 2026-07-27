import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface CheckItem {
  variantId: string;
  quantity: number;
}

/**
 * POST { items: CheckItem[] }
 * Called right before "Proceed to Checkout" — cart items snapshot stock at
 * add-to-cart time, which can go stale (someone else bought the last few,
 * or the customer's own cart just wants more than what's on hand). Returns
 * live availability per variant so the cart page can offer a pre-booking
 * split for any shortfall before checkout, instead of the order silently
 * going through unvalidated.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items: CheckItem[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ results: [] });

  const variantIds = items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: {
      id: true,
      stockQty: true,
      reservedQty: true,
      preBookedQty: true,
      product: {
        select: {
          preBookingMode: true,
          preBookingMaxTotalQty: true,
          preBookingEtaMinDays: true,
          preBookingEtaMaxDays: true,
        },
      },
    },
  });
  const byId = Object.fromEntries(variants.map((v) => [v.id, v]));

  const results = items.map(({ variantId, quantity }) => {
    const v = byId[variantId];
    if (!v) return { variantId, available: 0, shortfall: quantity, preBookingEligible: false };

    const available = Math.max(0, v.stockQty - v.reservedQty);
    const shortfall = Math.max(0, quantity - available);
    const mode = v.product.preBookingMode;
    const remainingSlots = v.product.preBookingMaxTotalQty != null
      ? Math.max(0, v.product.preBookingMaxTotalQty - v.preBookedQty)
      : null;

    const preBookingEligible =
      shortfall > 0 &&
      mode !== "OFF" &&
      (remainingSlots == null || remainingSlots >= shortfall);

    const days = v.product.preBookingEtaMaxDays ?? v.product.preBookingEtaMinDays;
    const preBookingEtaLabel = days != null ? `Ships in ${days} days` : null;

    return { variantId, available, shortfall, preBookingEligible, preBookingEtaLabel };
  });

  return NextResponse.json({ results });
}
