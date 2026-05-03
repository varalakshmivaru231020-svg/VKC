import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await db.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const url = new URL(req.url);
    const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10")));

    const where = { productId: product.id, isApproved: true };

    const [total, reviews, agg] = await Promise.all([
      db.review.count({ where }),
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      db.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        images: r.images,
        createdAt: r.createdAt,
        author: [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || "Anonymous",
      })),
      summary: {
        averageRating: agg._avg.rating ?? 0,
        totalReviews:  agg._count._all,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    });
  } catch (err) {
    console.error("[v1/products/:slug/reviews]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}
