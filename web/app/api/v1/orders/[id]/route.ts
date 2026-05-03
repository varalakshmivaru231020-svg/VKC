import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const order = await db.order.findFirst({
    where: { id: params.id, userId: u.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Enrich items with productSlug for deep-linking from the app
  const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const products = await db.product.findMany({
    where: { OR: [{ id: { in: productIds } }, { slug: { in: productIds } }] },
    select: { id: true, slug: true },
  });
  const slugByRef: Record<string, string> = {};
  for (const p of products) { slugByRef[p.id] = p.slug; slugByRef[p.slug] = p.slug; }

  const items = order.items.map((i) => ({ ...i, productSlug: slugByRef[i.productId] ?? null }));
  return NextResponse.json({ order: { ...order, items } });
}
