import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST { variantIds: string[] } → ProductData[] for those variants
export async function POST(req: NextRequest) {
  const { variantIds } = await req.json().catch(() => ({ variantIds: [] }));
  if (!Array.isArray(variantIds) || variantIds.length === 0) {
    return NextResponse.json([]);
  }

  const products = await db.product.findMany({
    where: {
      isActive: true,
      variants: { some: { id: { in: variantIds }, isActive: true } },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const mapped = products.map((p) => ({
    ...p,
    gstPercent: Number(p.gstPercent),
    variants: p.variants.map((v) => ({
      ...v,
      costPrice: Number(v.costPrice),
      salePrice: Number(v.salePrice),
      originalPrice: Number(v.originalPrice),
    })),
  }));

  return NextResponse.json(mapped);
}
