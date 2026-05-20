import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST { variantIds: string[] }
 * Called by the web WishlistSyncEffect whenever the Zustand wishlist changes.
 * Replaces the user's DB wishlist with the current local state so admin
 * Wishlist History always reflects real-time web wishlist data.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => null);
  const variantIds: string[] = Array.isArray(body?.variantIds) ? body.variantIds : [];

  await db.$transaction(async (tx) => {
    // Keep only items whose variant actually exists (guard against stale localStorage)
    const validVariants = variantIds.length > 0
      ? await tx.productVariant.findMany({
          where: { id: { in: variantIds }, isActive: true },
          select: { id: true },
        })
      : [];
    const validIds = validVariants.map((v) => v.id);

    // Remove items no longer in the local list
    await tx.wishlistItem.deleteMany({
      where: { userId, variantId: { notIn: validIds } },
    });

    // Upsert each valid item (idempotent — safe to re-run)
    for (const variantId of validIds) {
      await tx.wishlistItem.upsert({
        where:  { userId_variantId: { userId, variantId } },
        update: {},
        create: { userId, variantId },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
