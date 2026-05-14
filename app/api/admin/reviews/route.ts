import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET — paginated list of reviews for the admin moderation page.
 * Filters: ?q (matches user, product, body), ?approved (true|false|all),
 * ?productId, ?userId, ?page, ?limit.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q         = url.searchParams.get("q")?.trim() ?? "";
  const approved  = url.searchParams.get("approved") ?? "all"; // all|true|false
  const productId = url.searchParams.get("productId") ?? undefined;
  const userId    = url.searchParams.get("userId") ?? undefined;
  const page      = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
  const limit     = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25")));

  const where: any = {};
  if (productId) where.productId = productId;
  if (userId)    where.userId    = userId;
  if (approved === "true")  where.isApproved = true;
  if (approved === "false") where.isApproved = false;
  if (q) {
    where.OR = [
      { body:    { contains: q, mode: "insensitive" } },
      { title:   { contains: q, mode: "insensitive" } },
      { user:    { OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
      ] } },
      { product: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user:    { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
        orderItem: {
          select: {
            id: true, productName: true, variantColor: true, sareeCode: true,
            order: { select: { id: true, orderNumber: true, deliveredAt: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    reviews: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
