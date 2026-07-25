import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

interface SyncItem {
  productId: string;
  variantId: string;
  quantity: number;
}

/**
 * POST { items: SyncItem[] }
 * Called by the Flutter app after every cart mutation (add / remove / update qty).
 * Replaces the user's DB cart with the current device cart state so admin
 * Cart History always reflects real-time mobile cart data.
 */
export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const body = await req.json().catch(() => null);
  const items: SyncItem[] = Array.isArray(body?.items) ? body.items : [];

  await db.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({
      where:  { userId: u.id },
      create: { userId: u.id },
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

/**
 * GET — fetch the user's saved cart from DB (used on app resume / login).
 */
export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const cart = await db.cart.findUnique({
    where: { userId: u.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true } },
              images:  { select: { url: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ items: cart?.items ?? [] });
}
