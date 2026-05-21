import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const page    = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const isExport = sp.get("export") === "1";
  const limit   = isExport ? 2000 : 30;
  const q       = sp.get("q")?.trim() ?? "";
  const product = sp.get("product")?.trim() ?? "";
  const from    = sp.get("from") ?? "";
  const to      = sp.get("to") ?? "";

  const where: any = {
    items: {
      some: product
        ? { variant: { product: { name: { contains: product, mode: "insensitive" } } } }
        : {},
    },
  };

  if (from || to) {
    where.updatedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  if (q) {
    where.user = {
      OR: [
        { firstName:      { contains: q, mode: "insensitive" } },
        { lastName:       { contains: q, mode: "insensitive" } },
        { email:          { contains: q, mode: "insensitive" } },
        { phone:          { contains: q } },
        { customerNumber: isNaN(parseInt(q)) ? undefined : parseInt(q) },
      ].filter(Boolean),
    };
  }

  const [total, carts] = await Promise.all([
    db.cart.count({ where }),
    db.cart.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true,
            email: true, phone: true, customerNumber: true, isActive: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                id: true, colorName: true, colorHex: true,
                sareeCode: true, salePrice: true, originalPrice: true,
                product: { select: { id: true, name: true } },
                images:  { select: { url: true }, take: 1 },
              },
            },
          },
          orderBy: { addedAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip:    isExport ? 0 : (page - 1) * limit,
      take:    limit,
    }),
  ]);

  return NextResponse.json({
    total,
    totalPages: Math.ceil(total / limit),
    page,
    data: carts,
  });
}
