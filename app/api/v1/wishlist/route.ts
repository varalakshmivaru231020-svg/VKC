import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

/** GET — full wishlist with product/variant details. */
export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const items = await db.wishlistItem.findMany({
    where: { userId: u.id },
    orderBy: { addedAt: "desc" },
    include: {
      variant: {
        include: {
          images:  { orderBy: { sortOrder: "asc" } },
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  const enriched = items.map((it) => ({
    id:       it.id,
    addedAt:  it.addedAt,
    variant: {
      ...it.variant,
      costPrice:     Number(it.variant.costPrice),
      salePrice:     Number(it.variant.salePrice),
      originalPrice: Number(it.variant.originalPrice),
    },
  }));

  return NextResponse.json({ items: enriched });
}

/** POST { variantId } — add to wishlist (idempotent). */
export async function POST(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const { variantId } = await req.json();
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  const item = await db.wishlistItem.upsert({
    where:  { userId_variantId: { userId: u.id, variantId } },
    update: {},
    create: { userId: u.id, variantId },
  });
  return NextResponse.json({ item });
}

/** DELETE ?variantId=... — remove from wishlist. */
export async function DELETE(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const variantId = new URL(req.url).searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "variantId required" }, { status: 400 });

  await db.wishlistItem.deleteMany({ where: { userId: u.id, variantId } });
  return NextResponse.json({ success: true });
}
