import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — list all variants with product info for stock management */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const categoryId = searchParams.get("categoryId") || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const variants = await db.productVariant.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      ...(lowStock ? { stockQty: { lte: 5 } } : {}),
    },
    include: {
      product: {
        select: { id: true, name: true, slug: true, category: { select: { id: true, name: true } } },
      },
      images: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ product: { name: "asc" } }, { colorName: "asc" }],
  });

  return NextResponse.json({ variants });
}

/** PUT — bulk update stock quantities */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { updates } = await req.json() as {
    updates: { id: string; stockQty: number; reservedQty?: number }[];
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array required" }, { status: 400 });
  }

  const results = await db.$transaction(
    updates.map(({ id, stockQty, reservedQty }) =>
      db.productVariant.update({
        where: { id },
        data: {
          stockQty: Math.max(0, Math.round(stockQty)),
          ...(reservedQty !== undefined ? { reservedQty: Math.max(0, Math.round(reservedQty)) } : {}),
        },
        select: { id: true, stockQty: true, reservedQty: true },
      })
    )
  );

  return NextResponse.json({ updated: results.length, results });
}

/** PATCH — update single variant stock */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, stockQty, reservedQty } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const variant = await db.productVariant.update({
    where: { id },
    data: {
      ...(stockQty !== undefined ? { stockQty: Math.max(0, Math.round(stockQty)) } : {}),
      ...(reservedQty !== undefined ? { reservedQty: Math.max(0, Math.round(reservedQty)) } : {}),
    },
    select: { id: true, stockQty: true, reservedQty: true },
  });

  return NextResponse.json({ variant });
}
