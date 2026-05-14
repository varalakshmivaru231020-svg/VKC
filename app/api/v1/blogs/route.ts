import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10")));
    const tag   = url.searchParams.get("tag") ?? undefined;

    const where: any = { isPublished: true };
    if (tag) where.tags = { has: tag };

    const [total, blogs] = await Promise.all([
      db.blog.count({ where }),
      db.blog.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, slug: true, excerpt: true,
          imageUrl: true, tags: true, publishedAt: true, createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      blogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    });
  } catch (err) {
    console.error("[v1/blogs]", err);
    return NextResponse.json({ error: "Failed to load blogs" }, { status: 500 });
  }
}
