import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUnauthorized, requireMobileUser } from "@/lib/api/mobile-auth";

export const dynamic = "force-dynamic";

/**
 * GET — list current user's orders, paginated and filterable by status.
 * Query: ?page=1&limit=10&status=PENDING
 */
export async function GET(req: Request) {
  const u = await requireMobileUser(req);
  if (isUnauthorized(u)) return u;

  const url = new URL(req.url);
  const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10")));
  const statusParam = url.searchParams.get("status");

  const where: any = { userId: u.id };
  if (statusParam) where.status = statusParam.toUpperCase();

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: true },
    }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  });
}
