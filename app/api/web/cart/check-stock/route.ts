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
 * add-to-cart time, which can go stale (someone else bought the last few).
 * Returns live availability per variant so the cart page can flag any
 * shortfall before checkout, instead of the order silently going through
 * unvalidated.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items: CheckItem[] = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ results: [] });

  const variantIds = items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, stockQty: true, reservedQty: true },
  });
  const byId = Object.fromEntries(variants.map((v) => [v.id, v]));

  const results = items.map(({ variantId, quantity }) => {
    const v = byId[variantId];
    if (!v) return { variantId, available: 0, shortfall: quantity };

    const available = Math.max(0, v.stockQty - v.reservedQty);
    const shortfall = Math.max(0, quantity - available);
    return { variantId, available, shortfall };
  });

  return NextResponse.json({ results });
}
