import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChevronRight, Package } from "lucide-react";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const order = await db.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!order) notFound();

  // Some legacy orders store the slug in productId instead of the real CUID,
  // so look up by either id OR slug and map both ways.
  const productRefs = Array.from(new Set(order.items.map((i) => i.productId)));
  const products = await db.product.findMany({
    where: { OR: [{ id: { in: productRefs } }, { slug: { in: productRefs } }] },
    select: { id: true, slug: true },
  });
  const slugByRef: Record<string, string> = {};
  for (const p of products) {
    slugByRef[p.id] = p.slug;
    slugByRef[p.slug] = p.slug;
  }
  const itemsWithSlug = order.items.map((i) => ({ ...i, productSlug: slugByRef[i.productId] ?? null }));
  const orderForClient = { ...order, items: itemsWithSlug };

  return <OrderDetailClient order={JSON.parse(JSON.stringify(orderForClient))} />;
}
