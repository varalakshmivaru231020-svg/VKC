import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const page    = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const isExport = sp.get("export") === "1";
  const limit   = isExport ? 2000 : 30;
  const q       = sp.get("q")?.trim() ?? "";
  const product = sp.get("product")?.trim() ?? "";
  const from    = sp.get("from") ?? "";
  const to      = sp.get("to") ?? "";

  const where: any = {};

  if (product) {
    where.variant = { product: { name: { contains: product, mode: "insensitive" } } };
  }

  if (from || to) {
    where.addedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  if (q) {
    where.user = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
        { phone:     { contains: q } },
        { customerNumber: isNaN(parseInt(q)) ? undefined : parseInt(q) },
      ].filter(Boolean),
    };
  }

  const [total, items, topProducts] = await Promise.all([
    db.wishlistItem.count({ where }),
    db.wishlistItem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true,
            email: true, phone: true, customerNumber: true, isActive: true,
          },
        },
        variant: {
          select: {
            id: true, colorName: true, colorHex: true,
            sareeCode: true, salePrice: true, originalPrice: true,
            product: { select: { id: true, name: true } },
            images:  { select: { url: true }, take: 1 },
          },
        },
      },
      orderBy: { addedAt: "desc" },
      skip:    isExport ? 0 : (page - 1) * limit,
      take:    limit,
    }),
    db.wishlistItem.groupBy({
      by: ["variantId"],
      _count: { variantId: true },
      orderBy: { _count: { variantId: "desc" } },
      take: 8,
    }),
  ]);

  const topVariantIds = topProducts.map(t => t.variantId);
  const topVariants = topVariantIds.length > 0
    ? await db.productVariant.findMany({
        where: { id: { in: topVariantIds } },
        select: {
          id: true, colorName: true,
          product: { select: { name: true } },
          images:  { select: { url: true }, take: 1 },
        },
      })
    : [];

  const topVariantMap = Object.fromEntries(topVariants.map(v => [v.id, v]));

  return NextResponse.json({
    total,
    totalPages: Math.ceil(total / limit),
    page,
    data: items,
    topProducts: topProducts
      .map(tp => ({ count: tp._count.variantId, variant: topVariantMap[tp.variantId] ?? null }))
      .filter(tp => tp.variant),
  });
}
