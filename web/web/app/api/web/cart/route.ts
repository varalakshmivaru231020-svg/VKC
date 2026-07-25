import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SyncItem {
  productId: string;
  variantId: string;
  quantity: number;
}

/**
 * POST { items: SyncItem[] }
 * Called by the web CartSyncEffect whenever the Zustand cart changes.
 * Replaces the user's DB cart with the current local state so admin
 * Cart History always reflects real-time web cart data.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const items: SyncItem[] = Array.isArray(body?.items) ? body.items : [];

  await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where:  { userId },
      create: { userId },
      update: { updatedAt: new Date() },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (items.length > 0) {
      await tx.cartItem.createMany({
        data: items
          .filter((i) => i.variantId && i.productId && i.quantity > 0)
          .map((i) => ({
            cartId:    cart.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity:  i.quantity,
          })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
